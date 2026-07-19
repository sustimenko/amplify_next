"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Выносим всю логику приложения в отдельный внутренний компонент.
// Это гарантирует, что компонент смонтируется ТОЛЬКО тогда, 
// когда Authenticator уже полностью завершил вход и токен (JWT) готов к работе.
function Catalog({ user, signOut }: { user: any; signOut: () => void }) {
  const [instruments, setInstruments] = useState<Array<Schema["Instrument"]["type"]>>([]);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  async function fetchInstruments() {
    try {
      console.log("Запрос к AWS Amplify под учетной записью:", user?.signInDetails?.loginId);
      const { data } = await client.models.Instrument.list({
        authMode: "userPool"
      });
      console.log("Полученный массив данных:", data);
      setInstruments(data);
    } catch (error) {
      console.error("Ошибка при получении данных внутри контекста:", error);
    }
  }

  // Теперь этот useEffect сработает гарантированно с валидным токеном
  useEffect(() => {
    if (user) {
      fetchInstruments();
    }
  }, [user]);

 // Обязательно должно быть async перед (e: React.FormEvent)
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!name.trim()) {
    alert("Пожалуйста, введите название инструмента!");
    return;
  }

  try {
    console.log("Отправка запроса в AWS...");
    
    // Вот здесь await сработает без ошибок:
    const response = await client.models.Instrument.create({
      name,
      brand: brand || null,
      type: type as any, 
      description: description || null,
    }, {
      authMode: "userPool"
    });

    console.log("Полный ответ AWS:", response);

    if (response.errors) {
      console.error("Ошибки от бэкенда AWS:", response.errors);
    }

    const newInstrument = response.data;

    const instrumentToRender = newInstrument || {
      id: Math.random().toString(),
      name: name,
      brand: brand || undefined,
      type: type || undefined,
      description: description || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInstruments((prev) => [...prev, instrumentToRender as any]);
    setName(""); setBrand(""); setType(""); setDescription("");

  } catch (error) {
    console.error("Критическая ошибка при сохранении:", error);
  }
}

  return (
    <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2>Каталог: {user?.signInDetails?.loginId}</h2>
        <button onClick={signOut} style={{ padding: "8px 16px", cursor: "pointer" }}>Выйти</button>
      </header>

      <section style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
        <h3 style={{ marginTop: 0 }}>Добавить инструмент</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Название *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Yamaha Pacifica 112"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Бренд</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Например: Yamaha"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Тип</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Например: Guitar, Bass, Piano"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите инструмент..."
              style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "60px" }}
            />
          </div>

          <button type="submit" style={{ padding: "10px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            Сохранить в каталог
          </button>
        </form>
      </section>

      <section>
        <h3>Твоя коллекция (Всего: {instruments.length})</h3>
        {instruments.length === 0 ? (
          <p style={{ color: "#666" }}>В каталоге пока пусто. Заполни форму выше!</p>
        ) : (
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            {instruments.map((instrument) => (
              <li key={instrument.id} style={{ marginBottom: "12px" }}>
                <strong>{instrument.name}</strong>
                {instrument.brand && ` (${instrument.brand})`}
                {instrument.type && ` — ${String(instrument.type)}`}
                {instrument.description && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666", fontStyle: "italic" }}>
                    {instrument.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Корневой компонент теперь занимается только авторизацией
export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => <Catalog user={user} signOut={signOut!} />}
    </Authenticator>
  );
}