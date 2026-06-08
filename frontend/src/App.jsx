import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [word, setWord] = useState("");
  const [words, setWords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);

  const [editingWord, setEditingWord] = useState(null);
  const [editForm, setEditForm] = useState({
    meaning: "",
    synonym: "",
    antonym: "",
    example_sentence: "",
    turkish_translation: "",
  });

  const API_URL = "http://127.0.0.1:8000";

  const getWords = async () => {
    const response = await axios.get(`${API_URL}/words`);
    setWords(response.data);
  };

  const getTodayReviews = async () => {
    const response = await axios.get(`${API_URL}/reviews/today`);
    setWords(response.data);
  };

  const getWeakWords = async () => {
    const response = await axios.get(`${API_URL}/words/weak`);
    setWords(response.data);
  };

  const refreshWords = () => {
    if (activeTab === "all") {
      getWords();
    } else if (activeTab === "today") {
      getTodayReviews();
    } else if (activeTab === "weak") {
      getWeakWords();
    }
  };

  const addWord = async () => {
    if (!word.trim()) return;
    await axios.post(`${API_URL}/words/add?word=${word}`);
    setWord("");
    refreshWords();
  };

  const loadDefaultWords = async () => {
  await axios.post(`${API_URL}/words/load-default`);
  refreshWords();
};

  const deleteWord = async (id) => {
    await axios.delete(`${API_URL}/words/${id}`);
    refreshWords();
  };

  const reviewWord = async (id, status) => {
    await axios.post(`${API_URL}/words/${id}/review?status=${status}`);
    refreshWords();
  };

  const openEditModal = (item) => {
    setEditingWord(item);
    setEditForm({
      meaning: item.meaning || "",
      synonym: item.synonym || "",
      antonym: item.antonym || "",
      example_sentence: item.example_sentence || "",
      turkish_translation: item.turkish_translation || "",
    });
  };

  const closeEditModal = () => {
    setEditingWord(null);
  };

  const updateWord = async () => {
    if (!editingWord) return;
    await axios.put(`${API_URL}/words/${editingWord.id}`, editForm);
    closeEditModal();
    refreshWords();
  };

  const showAllWords = () => {
    setActiveTab("all");
    getWords();
  };

  const showTodayReviews = () => {
    setActiveTab("today");
    getTodayReviews();
  };

  const showWeakWords = () => {
    setActiveTab("weak");
    getWeakWords();
  };

  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchText.toLowerCase())
  );

  const currentWord = filteredWords[currentIndex];

  const startStudyMode = () => {
    if (filteredWords.length === 0) return;
    setStudyMode(true);
    setCurrentIndex(0);
    setShowMeaning(false);
  };

  const closeStudyMode = () => {
    setStudyMode(false);
    setCurrentIndex(0);
    setShowMeaning(false);
  };

  const reviewCurrentWord = async (status) => {
    if (!currentWord) return;

    await axios.post(`${API_URL}/words/${currentWord.id}/review?status=${status}`);

    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
    } else {
      alert("Çalışma tamamlandı 🎉");
      closeStudyMode();
      refreshWords();
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/words`).then((response) => {
      setWords(response.data);
    });
  }, []);

  const knownCount = words.filter((w) => w.level === "known").length;
  const mediumCount = words.filter((w) => w.level === "medium").length;
  const weakCount = words.filter((w) => w.level === "weak").length;

  const progressPercent =
    filteredWords.length > 0
      ? ((currentIndex + 1) / filteredWords.length) * 100
      : 0;

  return (
    <div className="page">
      <h1 className="title">YDS / YÖKDİL AI Kelime Uygulaması</h1>

      <div className="study-mode-box">
        <button onClick={startStudyMode}>🎴 Kelime Kartı Modu</button>
      </div>

      <div className="top-area">
        <div className="stats">
          <div className="stat-card">
            <h3>{words.length}</h3>
            <p>Toplam Kelime</p>
          </div>

          <div className="stat-card">
            <h3>{knownCount}</h3>
            <p>Bilinen</p>
          </div>

          <div className="stat-card">
            <h3>{mediumCount}</h3>
            <p>Zorlanılan</p>
          </div>

          <div className="stat-card">
            <h3>{weakCount}</h3>
            <p>Bilinmeyen</p>
          </div>
        </div>

        <div className="tabs">
          <button
            className={activeTab === "all" ? "active-tab" : ""}
            onClick={showAllWords}
          >
            📚 Tüm Kelimeler
          </button>

          <button
            className={activeTab === "today" ? "active-tab" : ""}
            onClick={showTodayReviews}
          >
            🔥 Bugünkü Tekrarlar
          </button>

          <button
            className={activeTab === "weak" ? "active-tab" : ""}
            onClick={showWeakWords}
          >
            🔴 Zayıf Kelimeler
          </button>
        </div>
      </div>



      <div className="add-box">
        <input
          type="text"
          placeholder="Kelime gir..."
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />

        <button onClick={addWord}>Ekle</button>

        <button className="load-btn" onClick={loadDefaultWords}>
          📥 Paket Yükle
        </button>
      </div>

      <h2 className="section-title">
        {activeTab === "all"
          ? "Kelime Listem"
          : activeTab === "today"
          ? "Bugünkü Tekrarlar"
          : "Zayıf Kelimeler"}
      </h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="🔍 Kelime ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="word-list">
        {filteredWords.map((item) => (
          <div className="word-card" key={item.id}>
            <div className="word-info">
              <h3>{item.word}</h3>
              <p>
                <strong>Anlam:</strong> {item.meaning}
              </p>
              <p>
                <strong>Seviye:</strong> {item.level}
              </p>
              <p>
                <strong>Tekrar Tarihi:</strong> {item.next_review}
              </p>
            </div>

            <div className="card-actions">
              <button
                className="btn-weak"
                onClick={() => reviewWord(item.id, "bilmiyorum")}
              >
                Bilmiyorum
              </button>

              <button
                className="btn-medium"
                onClick={() => reviewWord(item.id, "zorlandim")}
              >
                Zorlandım
              </button>

              <button
                className="btn-known"
                onClick={() => reviewWord(item.id, "biliyorum")}
              >
                Biliyorum
              </button>

              <button className="edit-btn" onClick={() => openEditModal(item)}>
                Düzenle
              </button>

              <button className="delete-btn" onClick={() => deleteWord(item.id)}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {studyMode && currentWord && (
        <div className="modal-overlay">
          <div className="study-card">
            <button className="close-btn" onClick={closeStudyMode}>
              ×
            </button>

            <p className="card-counter">
              {currentIndex + 1} / {filteredWords.length}
            </p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <h2>{currentWord.word}</h2>

            {!showMeaning ? (
              <div className="hidden-meaning-actions">
                <button
                  className="show-meaning-btn"
                  onClick={() => setShowMeaning(true)}
                >
                  Anlamı Göster
                </button>

                <button
                  className="known-direct-btn"
                  onClick={() => reviewCurrentWord("biliyorum")}
                >
                  Biliyorum
                </button>
              </div>
            ) : (
              <div className="meaning-area">
                <p>
                  <strong>Anlam:</strong> {currentWord.meaning}
                </p>
                <p>
                  <strong>Eş Anlamlı:</strong> {currentWord.synonym}
                </p>
                <p>
                  <strong>Zıt Anlamlı:</strong> {currentWord.antonym}
                </p>
                <p>
                  <strong>Örnek Cümle:</strong> {currentWord.example_sentence}
                </p>
                <p>
                  <strong>Türkçesi:</strong> {currentWord.turkish_translation}
                </p>

                <div className="modal-actions">
                  <button
                    className="btn-weak"
                    onClick={() => reviewCurrentWord("bilmiyorum")}
                  >
                    Bilmiyorum
                  </button>

                  <button
                    className="btn-medium"
                    onClick={() => reviewCurrentWord("zorlandim")}
                  >
                    Zorlandım
                  </button>

                  <button
                    className="btn-known"
                    onClick={() => reviewCurrentWord("biliyorum")}
                  >
                    Biliyorum
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingWord && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <button className="close-btn" onClick={closeEditModal}>
              ×
            </button>

            <h2>{editingWord.word} kelimesini düzenle</h2>

            <label>Anlam</label>
            <input
              value={editForm.meaning}
              onChange={(e) =>
                setEditForm({ ...editForm, meaning: e.target.value })
              }
            />

            <label>Eş Anlamlı</label>
            <input
              value={editForm.synonym}
              onChange={(e) =>
                setEditForm({ ...editForm, synonym: e.target.value })
              }
            />

            <label>Zıt Anlamlı</label>
            <input
              value={editForm.antonym}
              onChange={(e) =>
                setEditForm({ ...editForm, antonym: e.target.value })
              }
            />

            <label>Örnek Cümle</label>
            <textarea
              value={editForm.example_sentence}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  example_sentence: e.target.value,
                })
              }
            />

            <label>Türkçe Çeviri</label>
            <textarea
              value={editForm.turkish_translation}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  turkish_translation: e.target.value,
                })
              }
            />

            <button className="save-btn" onClick={updateWord}>
              Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;