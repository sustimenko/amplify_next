import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // Сущность: Музыкальный инструмент
  Instrument: a
    .model({
      name: a.string().required(),
      brand: a.string(),
      type: a.string(), // Ваши основные направления
      description: a.string(),
      tracks: a.hasMany("Track", "instrumentId"), // Связь: один инструмент — много треков
    })
    .authorization((allow) => [allow.owner()]), // Доступ: только ваш личный каталог

  // Сущность: Музыкальный трек (ваши записи)
  Track: a
    .model({
      title: a.string().required(),
      genre: a.string(),
      audioUrl: a.string(), // Ссылка на файл в S3
      instrumentId: a.id(),
      instrument: a.belongsTo("Instrument", "instrumentId"), // Обратная связь
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool", // Основной режим — пользователи
    apiKeyAuthorizationMode: {
      expiresInDays: 30, // Срок действия ключа
    },
  },
});
