import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { WebView } from 'react-native-webview';

const CAPTCHA_HTML = (siteKey) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://www.google.com/recaptcha/api.js"></script>
      <script>
        function onSubmit(token) {
          window.ReactNativeWebView.postMessage(token);
        }
      </script>
      <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
      </style>
    </head>
    <body>
      <form action="javascript:void(0);" style="margin-top: 40px;">
        <div class="g-recaptcha" data-sitekey="${siteKey}" data-callback="onSubmit"></div>
      </form>
    </body>
  </html>
`;

export default function CaptchaWebView({ siteKey, onVerify }) {
  const webviewRef = useRef(null);

  return (
    <View style={{ height: 180, marginVertical: 10 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: CAPTCHA_HTML(siteKey) }}
        javaScriptEnabled
        onMessage={event => {
          if (event.nativeEvent.data) {
            onVerify(event.nativeEvent.data);
          }
        }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        automaticallyAdjustContentInsets={false}
      />
    </View>
  );
}
