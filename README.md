# СКИФ — Мониторинг инжектора

Веб-дашборд для визуализации параметров линейного ускорителя и бустерного синхротрона СКИФ.

## Требования

- Java 17+
- Maven 3.8+
- Node.js 20+ (устанавливается автоматически через frontend-maven-plugin)

## Сборка и запуск

```bash
mvn clean package -DskipTests
java -jar target/skif-monitor.jar
```

Открыть http://localhost:8080

## Режим разработки

Backend:
```bash
mvn spring-boot:run
```

Frontend (отдельный терминал):
```bash
cd frontend
npm install
npm run dev
```

Frontend dev-сервер на http://localhost:5173 проксирует API на :8080.

## Конфигурация

`src/main/resources/application.yml`:
- `epics.simulation-mode: true` — режим симуляции (по умолчанию)
- `epics.simulation-mode: false` — подключение к реальному EPICS IOC

## API

- `GET /api/stream` — SSE поток данных (обновление каждую секунду)
- `GET /api/current` — текущий снапшот
- `GET /api/health` — статус приложения

## Стек

- Backend: Java 17, Spring Boot 3, WebFlux (SSE)
- Frontend: React 18, TypeScript, Recharts, Tailwind CSS
- Сборка: Maven + frontend-maven-plugin → единый JAR
