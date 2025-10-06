import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const DebugButton: React.FC = () => {
  const testDirectCall = async () => {
    console.log('🔥 TESTING DIRECT FETCH');
    console.log('Window location:', window.location.href);
    console.log('Fetch available?', typeof fetch);
    
    try {
      // Try using XMLHttpRequest as fallback
      const testWithXHR = () => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'http://localhost:3001/api/chat'); // Allow localhost - debug only
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`XHR failed: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('XHR network error'));
          xhr.send(JSON.stringify({
            messages: [
              { role: 'system', content: 'Reply in 5 words' },
              { role: 'user', content: 'Say hello' }
            ],
            modelType: 'haiku'
          }));
        });
      };
      
      // First try regular fetch
      console.log('Trying regular fetch...');
      const response = await fetch('http://localhost:3001/api/chat', { // Allow localhost - debug only
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Reply in 5 words' },
            { role: 'user', content: 'Say hello' }
          ],
          modelType: 'haiku'
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ SUCCESS! Claude said:', data.message);
      alert(`SUCCESS! Claude said: ${data.message}`);
      
    } catch (error: any) {
      console.error('❌ FETCH FAILED');
      console.error('Error:', error);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      
      // Try XHR as fallback
      console.log('Trying XMLHttpRequest as fallback...');
      try {
        const data: any = await testWithXHR();
        console.log('✅ XHR SUCCESS! Claude said:', data.message);
        alert(`XHR SUCCESS! Claude said: ${data.message}`);
      } catch (xhrError: any) {
        console.error('❌ XHR also failed:', xhrError);
        alert(`Both fetch and XHR failed: ${error.message} | ${xhrError.message}`);
      }
    }
  };
  
  return (
    <TouchableOpacity style={styles.button} onPress={testDirectCall}>
      <Text style={styles.text}>Test Claude API</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  }
});