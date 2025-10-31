# Soniox ASR Web UI

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/neosun100/soniox-asr-web?style=social)](https://github.com/neosun100/soniox-asr-web/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/neosun100/soniox-asr-web?style=social)](https://github.com/neosun100/soniox-asr-web/network/members)
[![GitHub issues](https://img.shields.io/github/issues/neosun100/soniox-asr-web)](https://github.com/neosun100/soniox-asr-web/issues)
[![GitHub license](https://img.shields.io/github/license/neosun100/soniox-asr-web)](https://github.com/neosun100/soniox-asr-web/blob/main/LICENSE)
[![Python](https://img.shields.io/badge/python-3.7+-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com/)

[简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [English](README.md) | [日本語](README.ja.md)

</div>

---

Soniox API に基づく完全な音声認識 Web アプリケーション。ファイル文字起こし、リアルタイム音声認識、多言語翻訳をサポート。

## 📸 インターフェースプレビュー

### REST API バッチアップロード

<div align="center">

![REST API バッチアップロードインターフェース](screenshot-rest-api.png)

*ファイル文字起こしインターフェース、音声処理オプション付き：ノイズ除去、速度変更、バッチアップロード対応*

</div>

### WebSocket リアルタイム文字起こし

<div align="center">

![WebSocket リアルタイムインターフェース](screenshot-websocket.png)

*リアルタイム音声認識、多言語翻訳と話者分離対応*

</div>

**3つのコア機能**：
- **ファイル文字起こし**：音声ファイルの一括アップロード、長時間音声の自動分割、並列処理
- **リアルタイム音声**：WebSocket リアルタイム文字起こし、マイク録音と話者分離をサポート
- **多言語翻訳**：60以上の言語をサポート、一方向/双方向リアルタイム翻訳

---

## ✨ 機能

### 📁 ファイル文字起こし（REST API）

- ✅ **マルチフォーマット対応**：mp3, wav, m4a, flac, ogg など 60以上の音声フォーマット
- ✅ **動画対応**：動画ファイルから音声を自動抽出（mp4, webm, mov, avi など）
- ✅ **音声処理**：ノイズ除去と速度変更（1.25x-2.0x）オプション
- ✅ **スマート分割**：5時間を超える長時間音声ファイルを自動処理
- ✅ **バッチ処理**：最大100ファイルの同時アップロード、並行数設定可能
- ✅ **話者分離**：異なる話者を自動識別（最大15人）
- ✅ **リアルタイム進捗**：プログレスバー、パーセンテージ、処理時間をリアルタイム表示
- ✅ **スマートリトライ**：API Key 失効時の自動切り替え、最大3回リトライ
- ✅ **結果ダウンロード**：個別またはバッチで TXT 形式の文字起こし結果をダウンロード
- ✅ **プライバシー優先**：すべての音声・動画処理はブラウザで完結、サーバーにアップロードされません

### 🎤 リアルタイム音声認識（WebSocket）

- ✅ **マイク録音**：ブラウザで直接録音、リアルタイム文字起こし
- ✅ **ストリーミング処理**：話しながら文字起こし、低遅延応答
- ✅ **話者分離**：異なる話者をリアルタイム識別
- ✅ **言語識別**：言語を自動検出してラベル付け
- ✅ **エンドポイント検出**：発話終了を自動識別（`<end>` トークン）
- ✅ **カラー表示**：異なる言語を異なる色でマーク

### 🌍 多言語翻訳

- ✅ **60以上の言語**：中国語、英語、日本語、韓国語、フランス語、ドイツ語などをサポート
- ✅ **一方向翻訳**：すべての言語をターゲット言語に翻訳
- ✅ **双方向翻訳**：2つの言語間の相互翻訳（例：中英相互翻訳）
- ✅ **リアルタイム翻訳**：話しながら翻訳、待機不要
- ✅ **カラーコーディング**：原文と訳文を異なる色で区別

---

## 🚀 クイックスタート

```bash
# プロジェクトをクローン
git clone https://github.com/neosun100/soniox-asr-web.git
cd soniox-asr-web

# 依存関係をインストール
pip3 install -r requirements.txt

# FFmpeg をインストール
brew install ffmpeg  # macOS
sudo apt-get install ffmpeg  # Ubuntu

# ワンクリック起動
chmod +x start.sh
./start.sh
```

アクセス：http://localhost:8000

完全なドキュメントは [English README](README.md) をご覧ください

---

<div align="center">

## 🌟 Star をください！🌟

**このプロジェクトが役に立ったら、GitHub で ⭐ Star をください！**

あなたのサポートが私たちの継続的な改善の最大の原動力です！🚀

[![GitHub stars](https://img.shields.io/github/stars/neosun100/soniox-asr-web?style=social)](https://github.com/neosun100/soniox-asr-web/stargazers)

[⭐ このリポジトリに Star](https://github.com/neosun100/soniox-asr-web) | [🐛 バグ報告](https://github.com/neosun100/soniox-asr-web/issues) | [✨ 機能リクエスト](https://github.com/neosun100/soniox-asr-web/issues)

---

Made with ❤️ by [Neo Sun](https://github.com/neosun100)

</div>
