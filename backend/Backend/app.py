from flask import Flask
from flask_cors import CORS
import os
from routes import register_blueprints

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "static/uploads"
app.config["OUTPUT_FOLDER"] = "static/outputs"

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["OUTPUT_FOLDER"], exist_ok=True)

# 如果你不需要 cookie 傳送，可用以下設定（較簡單且常見）
CORS(app, resources={r"/*": {"origins": "*"}})  # 允許所有來源跨域

# 如果需要 cookie（認證等），且指定前端來源：
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

register_blueprints(app)

if __name__ == "__main__":
    app.run(port=5000, debug=True)