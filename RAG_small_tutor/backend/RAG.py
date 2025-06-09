# backend/app.py
import os, sys
import pickle
from pathlib import Path
from typing import List
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI,
)
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain.prompts import PromptTemplate

# --------- 0. 基本設定 ---------
# 從環境變量讀取API key，如果沒有則使用默認值
api_key = os.environ.get("GOOGLE_API_KEY", "AIzaSyCzAVDECY7L-YDdfHevYESC-SDyzHPulKQ")
os.environ["GOOGLE_API_KEY"] = api_key

genai.configure(api_key=api_key)

CACHE_PATH = Path("vec_db.pkl")     # 向量庫快取檔


INDEX_DIR = Path("faiss_index")        # 自訂資料夾；不存在會自動建立
# --------- 1. 載入 / 建立向量庫 ---------
def build_or_load_vector_db():
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    if INDEX_DIR.exists():
        return FAISS.load_local(
            folder_path=str(INDEX_DIR),
            embeddings=embeddings,      # ← 一定要傳同一個 embeddings！
            allow_dangerous_deserialization=True,
        )

    loader = DirectoryLoader("./doc", glob="**/*.pdf", loader_cls=PyPDFLoader)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=300)
    chunks = splitter.split_documents(docs)

    vec_db = FAISS.from_documents(chunks, embeddings)

    vec_db.save_local(str(INDEX_DIR))
    return vec_db


vector_db = build_or_load_vector_db()

# --------- 2. 建立 RAG Chain ---------
template = """
您是一位學測國文寫作的家教，教導學生撰寫作文的技巧，
如果上下文中沒有相關信息，請說明您不知道，而不要編造答案。

上下文信息:
{context}

問題:
{question}

請提供詳細、準確、有條理的回答，並根據上下文引用相關內容作為支持。
"""
PROMPT = PromptTemplate.from_template(template)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.2)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vector_db.as_retriever(search_kwargs={"k": 30}),
    combine_docs_chain_kwargs={"prompt": PROMPT},
    return_source_documents=True,
)

# --------- 3. FastAPI 伺服器 ---------
app = FastAPI(title="RAG Chat API")

# --- CORS：允許前端瀏覽器跨域呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    history: List[Tuple[str, str]] = []  # [[user, bot], ...]


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    hist: List[Tuple[str, str]] = [tuple(p) for p in req.history]
    result = qa_chain(
        {
            "question": req.question,
            "chat_history": req.history,
        }
    )

    answer = result["answer"]
    source_docs = result["source_documents"]
    sources = []
    
    for i, doc in enumerate(source_docs, 1):
        if i <= 5:
            sources.append(doc.metadata.get("source", f"page {i}"))

    return ChatResponse(answer=answer, sources=sources)
