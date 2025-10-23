import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  COUNTRIES,
  CountryInfo,
  detectCountry,
  formatPhoneWithCountry,
  validatePhoneForCountry,
} from '../utils/countryDetector';

interface PhoneInputProps {
  onPhoneSubmit: (phoneNumber: string) => void;
  loading?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ onPhoneSubmit, loading = false }) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect country on mount
  useEffect(() => {
    detectCountry().then(country => {
      setSelectedCountry(country);
      setDetectingLocation(false);
    });
  }, []);

  const handleSubmit = () => {
    if (!selectedCountry) {
      setError('Please select a country');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    try {
      // Validate phone for selected country
      if (!validatePhoneForCountry(phoneNumber, selectedCountry)) {
        setError(`Invalid phone number for ${selectedCountry.name}`);
        return;
      }

      // Format with country code
      const formattedPhone = formatPhoneWithCountry(phoneNumber, selectedCountry);
      onPhoneSubmit(formattedPhone);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const CountryPickerModal = () => (
    <Modal
      visible={showCountryPicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Country</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                  setError(null);
                }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
            style={styles.countryList}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCountryPicker(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (detectingLocation) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.detectingText}>Detecting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <Text style={styles.subtitle}>
        We'll send you a verification code to confirm your number
      </Text>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.countryFlag}>
            {selectedCountry?.flag || '🌐'}
          </Text>
          <Text style={styles.dialCode}>
            {selectedCountry?.dialCode || '+1'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.phoneInput}
          placeholder="Phone number"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            setError(null);
          }}
          keyboardType="phone-pad"
          maxLength={15}
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Text style={styles.formatHint}>
        {selectedCountry && getFormatHint(selectedCountry)}
      </Text>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <CountryPickerModal />
    </View>
  );
};

function getFormatHint(country: CountryInfo): string {
  const hints: Record<string, string> = {
    'US': 'Format: (XXX) XXX-XXXX',
    'IN': 'Format: 10 digit mobile number',
    'GB': 'Format: 10 or 11 digits',
    'CN': 'Format: 11 digit mobile number',
    'BR': 'Format: 10 or 11 digits with area code',
  };
  return hints[country.code] || `Enter your ${country.name} phone number`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  dialCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 5,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#E91E63',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
  },
  formatHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#E91E63',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detectingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  countryList: {
    paddingHorizontal: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  countryCode: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    alignItems: 'center',
    margin: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});