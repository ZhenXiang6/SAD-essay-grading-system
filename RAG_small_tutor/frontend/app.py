# frontend/app.py
import requests
import streamlit as st

API_URL = "http://localhost:8000/chat"

st.set_page_config(page_title="RAG Chatbot", page_icon="💬")
st.title("💬🔍 國寫作文小家教")

# 保存對話歷史
if "history" not in st.session_state:
    st.session_state.history = []  

# 回放歷史
for usr, bot in st.session_state.history:
    with st.chat_message("user"):
        st.markdown(usr)
    with st.chat_message("assistant"):
        st.markdown(bot)

# 取得輸入
if prompt := st.chat_input("輸入您的問題…"):
    with st.chat_message("user"):
        st.markdown(prompt)

    # 呼叫後端
    resp = requests.post(
        API_URL,
        json={
            "question": prompt,
            "history": st.session_state.history,
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()

    bot_answer = data["answer"]
    sources = data["sources"]

    st.session_state.history.append([prompt, bot_answer])

    with st.chat_message("assistant"):
        st.markdown(bot_answer)
        with st.expander("📑 參考來源"):
            for s in sources:
                st.markdown(f"- {s}")
