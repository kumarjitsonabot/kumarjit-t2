#!/data/data/com.termux/files/usr/bin/bash
cd ~/kumarjit-t2 || exit 1
trap 'echo ""; echo "🛑 KUMARJIT T2 বন্ধ করা হয়েছে"; exit 0' INT

termux-wake-lock 2>/dev/null
echo "🚀 KUMARJIT T2 চালু হচ্ছে... বন্ধ করতে Ctrl + C"

while true; do
  node index.mjs
  echo "⚠️ বট বন্ধ হয়েছে। ৫ সেকেন্ড পর আবার চালু হচ্ছে..."
  sleep 5
done
