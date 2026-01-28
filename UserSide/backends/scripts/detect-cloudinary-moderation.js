/*
  Detect Cloudinary moderation parameter values.

  Usage (PowerShell):
    cd UserSide/backends
    node scripts/detect-cloudinary-moderation.js

  Requires env vars:
    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET

  This script uploads a tiny generated PNG using different moderation values.
  The first value that succeeds is what you should put into Render as CLOUDINARY_MODERATION.
*/

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
  override: true
});
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function requiredEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

function tinyPngDataUri() {
  // Use a reasonably-sized image (> 80x80) so Rekognition moderation can run.
  // You can override this with MODERATION_TEST_IMAGE_URL in your local .env.
  return (
    process.env.MODERATION_TEST_IMAGE_URL ||
    'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/sample.jpg'
  );
}

async function tryModerationValue(value) {
  const opts = {
    folder: 'alertdavao/moderation_probe',
    public_id: `probe_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    resource_type: 'image',
    overwrite: true,
  };

  if (value) {
    opts.moderation = value;
  }

  const res = await cloudinary.uploader.upload(tinyPngDataUri(), opts);
  return res;
}

function safeErrorMessage(e) {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e.error && typeof e.error.message === 'string') return e.error.message;
  if (typeof e.message === 'string') return e.message;
  // Avoid printing full objects (may contain auth/request options)
  return 'Request failed';
}

async function main() {
  requiredEnv('CLOUDINARY_CLOUD_NAME');
  requiredEnv('CLOUDINARY_API_KEY');
  requiredEnv('CLOUDINARY_API_SECRET');

  const candidates = [
    // Common values people use for Rekognition moderation
    'aws_rek',
    'aws_rek:moderation',
    'aws_rek_moderation',

    // Common values people use for Google moderation
    'google_video_moderation',
    'google_moderation',

    // Generic / legacy
    'webpurify',
    'webpurify:adult',
  ];

  console.log('🔎 Detecting Cloudinary moderation parameter...');
  console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('Trying candidates:', candidates.join(', '));

  // First, verify credentials work with a plain upload.
  process.stdout.write(`\n✅ Verifying Cloudinary credentials (baseline upload)... `);
  try {
    await tryModerationValue('');
    console.log('OK');
  } catch (e) {
    console.log('FAILED');
    const msg = safeErrorMessage(e);
    console.log('   ', msg);
    if (msg.toLowerCase().includes('cloud_name mismatch') || msg.toLowerCase().includes('invalid cloud_name')) {
      console.log('\nFix: Your CLOUDINARY_CLOUD_NAME and API key/secret do not belong to the same Cloudinary Product Environment.');
      console.log('Go to Cloudinary → Product Environment with this cloud name → API Keys, then copy the key+secret from THAT environment.');
    }
    process.exit(1);
  }

  for (const value of candidates) {
    process.stdout.write(`\n➡️  Trying moderation="${value}" ... `);
    try {
      const result = await tryModerationValue(value);
      console.log('✅ SUCCESS');
      console.log('   Use this in Render:');
      console.log(`   CLOUDINARY_MODERATION=${value}`);
      console.log('   moderation field in response:', result.moderation);
      console.log('   uploaded asset:', result.secure_url);
      return;
    } catch (e) {
      const msg = safeErrorMessage(e);
      console.log('❌ failed');
      console.log('   ', msg);
    }
  }

  console.log('\n⚠️ None of the candidates worked.');
  console.log('Open the add-on page → Documentation link and look for the exact upload snippet,');
  console.log('then set that string as CLOUDINARY_MODERATION.');
}

main().catch((e) => {
  console.error('Fatal:', e?.message || e);
  process.exit(1);
});
