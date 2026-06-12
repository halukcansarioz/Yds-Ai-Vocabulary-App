import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [word, setWord] = useState("");
  const [words, setWords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showProgress, setShowProgress] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    known: 0,
    medium: 0,
    weak: 0,
  });

  const [topReviewedWords, setTopReviewedWords] = useState([]);

  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyWords, setStudyWords] = useState([]);
  const [studiedCount, setStudiedCount] = useState(0);

  const [totalReviews, setTotalReviews] = useState(
    Number(localStorage.getItem("totalReviews") || 0)
  );

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

  const getStats = async () => {
    const response = await axios.get(`${API_URL}/stats`);
    setStats(response.data);
  };

  const getTopReviewedWords = async () => {
    const response = await axios.get(`${API_URL}/stats/top-reviewed`);
    setTopReviewedWords(response.data);
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

  const currentWord = studyWords[currentIndex];
  
  const startStudyMode = () => {
    if (filteredWords.length === 0) {
      alert("Bu sekmede çalışılacak kelime yok.");
      setShowMeaning(false);
      setStudiedCount(0);
      return;
    }

    const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);

    setStudyWords(shuffledWords);
    setStudyMode(true);
    setCurrentIndex(0);
    setShowMeaning(false);
  };

  const closeStudyMode = () => {
    setStudyMode(false);
    setCurrentIndex(0);
    setShowMeaning(false);
    setStudyWords([]);
    setStudiedCount(0);
  };

  const reviewCurrentWord = async (status) => {
    if (!currentWord) return;

    await axios.post(`${API_URL}/words/${currentWord.id}/review?status=${status}`);
    setStudiedCount((prev) => prev + 1);

    setTotalReviews((prev) => {
    const newValue = prev + 1;
    localStorage.setItem("totalReviews", newValue);
    return newValue;
  });

    if (currentIndex < studyWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
    } else {
      alert("Çalışma tamamlandı 🎉");
      closeStudyMode();
      refreshWords();
      getTopReviewedWords();
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/words`).then((response) => {
      setWords(response.data);
      getStats();
    });
  }, []);

  const progressPercent =
    studyWords.length > 0
      ? ((currentIndex + 1) / studyWords.length) * 100
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
            <h3>{stats.total}</h3>
            <p>Toplam Kelime</p>
          </div>

          <div className="stat-card">
            <h3>{stats.known}</h3>
            <p>Bilinen</p>
          </div>

          <div className="stat-card">
            <h3>{stats.medium}</h3>
            <p>Zorlanılan</p>
          </div>

          <div className="stat-card">
            <h3>{stats.weak}</h3>
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

          <button
            className={showProgress ? "active-tab" : ""}
            onClick={() => setShowProgress(!showProgress)}
          >
            📊 İlerleme
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

      {showProgress && (
        <div className="progress-panel">
          <h2>📊 İlerleme Özeti</h2>

          <div className="progress-grid">
            <div>
              <strong>Toplam Kelime:</strong>
              <span>{stats.total}</span>
            </div>

            <div>
              <strong>Bilinen:</strong>
              <span>{stats.known}</span>
            </div>

            <div>
              <strong>Zorlanılan:</strong>
              <span>{stats.medium}</span>
            </div>

            <div>
              <strong>Bilinmeyen:</strong>
              <span>{stats.weak}</span>
            </div>

            <div>
              <strong>Toplam Tekrar:</strong>
              <span>{totalReviews}</span>
            </div>

            <div>
              <strong>Başarı Oranı:</strong>

            <div className="success-card">
              <div className="success-header">
                <strong>Başarı Oranı:</strong>
                <span>
                  {stats.total > 0
                    ? Math.round((stats.known / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>

              <div className="success-bar">
                <div
                  className="success-fill"
                  style={{
                    width: `${
                      stats.total > 0
                        ? Math.round((stats.known / stats.total) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
              <div className="success-bar">
                <div
                  className="success-fill"
                  style={{
                    width: `${
                      stats.total > 0
                        ? Math.round((stats.known / stats.total) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="top-reviewed">
            <h3>🏆 En Çok Çalışılan Kelimeler</h3>

            {topReviewedWords.length === 0 ? (
              <p>Henüz çalışma verisi yok.</p>
            ) : (
              topReviewedWords.map((item, index) => (
                <div className="top-reviewed-item" key={item.id}>
                  <span>{index + 1}. {item.word}</span>
                  <strong>{item.review_count} tekrar</strong>
                </div>
              ))
            )}
          </div>
        </div>
      )}
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

            <p className="studied-count">
              Bugün çalışılan: {studiedCount}
            </p>

            <p className="total-reviews">
              🏆 Toplam tekrar: {totalReviews}
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