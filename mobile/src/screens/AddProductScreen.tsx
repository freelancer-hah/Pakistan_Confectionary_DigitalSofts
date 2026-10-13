import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../api/supabase';
import { ProductType } from '../types/wholesale';
import { colors } from '../theme/colors';

interface AddProductScreenProps {
  navigation: any;
}

export default function AddProductScreen({ navigation }: AddProductScreenProps) {
  const [name, setName] = useState('');
  const [productType, setProductType] = useState<ProductType>('wholesale');
  const [unit, setUnit] = useState('Carton');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  function handleTypeChange(type: ProductType) {
    setProductType(type);
    if (type === 'wholesale') {
      setUnit('Carton');
    } else {
      setUnit('Piece');
    }
  }

  // Camera Picker
  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture product photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  }

  // Gallery Picker
  async function pickFromGallery() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not pick image.');
    }
  }

  function removeImage() {
    setImageUri(null);
    setImageBase64(null);
  }

  async function uploadImageToSupabase(): Promise<string | null> {
    if (!imageBase64) return null;

    setUploadingImage(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;

    try {
      const arrayBuffer = decode(imageBase64);
      const { data, error } = await supabase.storage
        .from('product_images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error('Image upload failed:', err);
      throw new Error(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveProduct() {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name / پروڈکٹ کا نام درج کریں');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price / درست قیمت درج کریں');
      return;
    }

    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity / اسٹاک کی تعداد درج کریں');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl: string | null = null;
      if (imageBase64) {
        finalImageUrl = await uploadImageToSupabase();
      }

      const { error } = await supabase.from('products').insert({
        name: name.trim(),
        product_type: productType,
        unit: unit.trim() || (productType === 'wholesale' ? 'Carton' : 'Piece'),
        price: numPrice,
        stock: numStock,
        image_url: finalImageUrl,
        description: description.trim() || null,
        is_active: true,
      });

      if (error) throw error;

      Alert.alert(
        'Product Added!',
        `"${name.trim()}" has been added to your catalog successfully.`,
        [
          {
            text: 'View Inventory',
            onPress: () => {
              // Reset
              setName('');
              setPrice('');
              setStock('');
              setDescription('');
              removeImage();
              navigation.navigate('Stock');
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              setName('');
              setPrice('');
              setStock('');
              setDescription('');
              removeImage();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save product to database.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Product</Text>
          <Text style={styles.headerSubtitle}>
            نیا پروڈکٹ شامل کریں • Wholesale or Retail
          </Text>
        </View>

        {/* Product Type Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Product Category / قسم</Text>
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.typeToggleOption,
                productType === 'wholesale' && styles.typeToggleActive,
              ]}
              onPress={() => handleTypeChange('wholesale')}
            >
              <Ionicons
                name="cube"
                size={18}
                color={productType === 'wholesale' ? colors.primaryDark : colors.slate500}
              />
              <Text
                style={[
                  styles.typeToggleText,
                  productType === 'wholesale' && styles.typeToggleTextActive,
                ]}
              >
                Wholesale (ہول سیل)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeToggleOption,
                productType === 'retail' && styles.typeToggleActiveRetail,
              ]}
              onPress={() => handleTypeChange('retail')}
            >
              <Ionicons
                name="pricetag"
                size={18}
                color={productType === 'retail' ? colors.info : colors.slate500}
              />
              <Text
                style={[
                  styles.typeToggleText,
                  productType === 'retail' && styles.typeToggleTextActiveRetail,
                ]}
              >
                Retail (پرچون)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Picker */}
        <View style={styles.card}>
          <Text style={styles.label}>Product Photo / تصویر</Text>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePickerRow}>
              <TouchableOpacity style={styles.pickerActionBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={26} color={colors.primary} />
                <Text style={styles.pickerActionText}>Take Camera Photo</Text>
                <Text style={styles.pickerSubText}>کیمرے سے تصویر لیں</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerActionBtn} onPress={pickFromGallery}>
                <Ionicons name="images" size={26} color={colors.info} />
                <Text style={styles.pickerActionText}>Choose from Gallery</Text>
                <Text style={styles.pickerSubText}>گیلری سے منتخب کریں</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
          <Text style={styles.label}>Product Name / پروڈکٹ کا نام *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Master Oil 16L Carton or Tapal Tea 450g"
            placeholderTextColor={colors.slate400}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={styles.label}>Unit / پیمانہ *</Text>
              <TextInput
                style={styles.input}
                placeholder="Carton / Piece"
                placeholderTextColor={colors.slate400}
                value={unit}
                onChangeText={setUnit}
              />
            </View>

            <View style={styles.colHalf}>
              <Text style={styles.label}>Price (PKR) / قیمت *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 4500"
                placeholderTextColor={colors.slate400}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={styles.label}>Initial Stock / اسٹاک *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor={colors.slate400}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>

            <View style={styles.colHalf}>
              <Text style={styles.label}>Stock Status Preview</Text>
              <View style={styles.stockPreviewBox}>
                <Text style={styles.stockPreviewText}>
                  {Number(stock) > 10 ? 'Healthy' : Number(stock) > 0 ? 'Low Stock' : 'Out of Stock'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Description / تفصیل (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Carton contains 12 packs of 1kg..."
            placeholderTextColor={colors.slate400}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (saving || uploadingImage) && styles.saveBtnDisabled]}
          onPress={handleSaveProduct}
          disabled={saving || uploadingImage}
        >
          {saving || uploadingImage ? (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.saveBtnText}>
                {uploadingImage ? 'Uploading Image...' : 'Saving Product...'}
              </Text>
            </View>
          ) : (
            <View style={styles.savingRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Save Product / پروڈکٹ محفوظ کریں</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.slate900,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate700,
    marginBottom: 8,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeToggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 8,
  },
  typeToggleActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeToggleActiveRetail: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate600,
  },
  typeToggleTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  typeToggleTextActiveRetail: {
    color: colors.info,
    fontWeight: '700',
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerActionBtn: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pickerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate700,
    marginTop: 6,
  },
  pickerSubText: {
    fontSize: 10,
    color: colors.slate400,
    marginTop: 2,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.slate100,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
  },
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.slate900,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  stockPreviewBox: {
    backgroundColor: colors.slate100,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stockPreviewText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate600,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
