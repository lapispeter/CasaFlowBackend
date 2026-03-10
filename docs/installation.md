# Gyors telepités

```cmd
git clone https://github.com/lapispeter/CasaFlowbackend.git
cd CasaFlowbackend
npm install
.env.example másolat készitése .env

DB_DIALECT= // pl. sqlite
DB_STORAGE= // pl.database.sqlite

MAIL_PASS=gpvh cazb khbb efqx

ADMIN_PASSWORD= //pl. titkos

node op key:generate
node op migrate
node op db:seed
npm run dev
```