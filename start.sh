#!/bin/bash

# AI作文批改系統 - 完整版啟動腳本
# 整合ResNet OCR模型 + Gemini API文字優化 + React前端

echo "🎓 AI作文批改系統 - 完整版啟動腳本"
echo "========================================"
echo "📋 功能特色："
echo "   🔍 ResNet OCR模型 - 自訓練的中文手寫文字識別"
echo "   🤖 Gemini AI文字優化 - Google AI驅動的文字優化"
echo "   🌐 React前端界面 - 現代化響應式設計"
echo "   🐳 Docker容器化 - 一鍵部署"
echo ""

# 檢查Docker是否安裝
if ! command -v docker &> /dev/null; then
    echo "❌ 錯誤：Docker未安裝，請先安裝Docker"
    exit 1
fi

# 檢查Docker Compose是否安裝
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 錯誤：Docker Compose未安裝，請先安裝Docker Compose"
    exit 1
fi

# 檢查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️  警告：.env文件不存在，正在從範例文件創建..."
    cp .env.example .env
    echo "📝 請編輯.env文件，填入您的Gemini API Key"
    echo "   GEMINI_API_KEY=your-gemini-api-key-here"
    echo ""
    echo "🔗 獲取Gemini API Key："
    echo "   https://makersuite.google.com/app/apikey"
    echo ""
    read -p "按Enter鍵繼續，或Ctrl+C退出編輯.env文件..."
fi

# 檢查Gemini API Key是否設置
if [ -f ".env" ]; then
    source .env
    if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your-gemini-api-key-here" ]; then
        echo "⚠️  警告：Gemini API Key未設置或使用預設值"
        echo "   請編輯.env文件設置正確的API Key"
        echo ""
    fi
fi

# 創建必要的目錄
echo "📁 創建必要的目錄..."
mkdir -p backend/static/uploads backend/static/outputs

# 檢查端口是否被占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  警告：端口$port已被占用（$service）"
        read -p "是否要停止占用端口的進程？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 停止占用端口$port的進程..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    fi
}

check_port 3000 "前端"
check_port 5000 "後端"

# 檢查OCR模型文件是否存在
if [ ! -f "backend/checkpoints/resnet18_ft_100epoch.pth" ]; then
    echo "❌ 錯誤：OCR模型文件不存在"
    echo "   請確保 backend/checkpoints/resnet18_ft_100epoch.pth 文件存在"
    exit 1
fi

if [ ! -f "backend/checkpoints/class_to_idx.json" ]; then
    echo "❌ 錯誤：OCR類別映射文件不存在"
    echo "   請確保 backend/checkpoints/class_to_idx.json 文件存在"
    exit 1
fi

echo "✅ OCR模型文件檢查通過"

# 構建並啟動服務
echo "🐳 構建Docker鏡像..."
echo "   正在構建後端服務（包含ResNet OCR模型）..."
docker-compose build backend

echo "   正在構建前端服務（React應用）..."
docker-compose build frontend

echo "🚀 啟動服務..."
docker-compose up -d

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 15

# 檢查服務狀態
echo "📊 檢查服務狀態..."
docker-compose ps

# 檢查後端服務是否正常運行
echo "🔍 檢查後端服務..."
if curl -f http://localhost:5000/api/upload_segment_ocr >/dev/null 2>&1; then
    echo "✅ 後端服務運行正常"
else
    echo "⚠️  後端服務可能未完全啟動，請稍等片刻"
fi

# 檢查前端服務是否正常運行
echo "🔍 檢查前端服務..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ 前端服務運行正常"
else
    echo "⚠️  前端服務可能未完全啟動，請稍等片刻"
fi

echo ""
echo "🎉 系統啟動完成！"
echo ""
echo "🌐 訪問地址："
echo "   前端界面：http://localhost:3000"
echo "   後端API：http://localhost:5000"
echo ""
echo "📋 API端點："
echo "   OCR識別：POST http://localhost:5000/api/upload_segment_ocr"
echo "   文字優化：POST http://localhost:5000/api/refine_ocr_text"
echo ""
echo "🔧 常用命令："
echo "   查看日誌：docker-compose logs -f"
echo "   停止服務：docker-compose down"
echo "   重啟服務：docker-compose restart"
echo "   查看狀態：docker-compose ps"
echo ""
echo "📝 使用說明："
echo "   1. 打開瀏覽器訪問 http://localhost:3000"
echo "   2. 上傳作文圖片（支援手寫稿紙）"
echo "   3. 系統自動進行格線切割和OCR識別"
echo "   4. 使用Gemini AI優化識別文字"
echo "   5. 獲得最終的作文文字結果"
echo ""
echo "🎓 系統特色："
echo "   ✨ 自訓練ResNet模型，專門針對中文手寫文字優化"
echo "   ✨ 智能格線切割，適應各種稿紙格式"
echo "   ✨ Gemini AI後處理，提升文字準確度"
echo "   ✨ 現代化React界面，操作簡單直觀"
echo ""
