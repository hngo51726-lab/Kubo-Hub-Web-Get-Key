KUBO HUB SYSTEM

Cau truc:
  server.js
  package.json
  public/index.html
  public/app.js
  .env.example

Cai dat local:
1. Cai Node.js (ban LTS).
2. Sao chep .env.example thanh .env va dien thong tin MySQL.
3. Mo terminal tai thu muc nay, chay: npm install
4. Chay: npm start
5. Mo http://localhost:3000

Luu y quan trong:
- Thong tin database trong .env.example la mau; can dien thong tin that.
- API hien chi kiem tra dinh dang URL Link4M, CHUA xac minh nguoi dung da vuot link. Can tich hop callback/API hop le cua Link4M truoc khi dung that.
- Nut tao key VIP hien chi tao ban ghi key, khong xu ly thanh toan. Khong giao key VIP cho khach truoc khi tich hop va xac minh cong thanh toan.
- Khong dung cac thong tin DB mau mac dinh tren hosting production.
- InfinityFree thuong khong chay ung dung Node.js/Express truc tiep tren goi hosting PHP/MySQL thong thuong. Can hosting co ho tro Node.js cho server.js; neu dung InfinityFree, can chuyen backend sang nen tang ho tro Node.js hoac viet lai API theo hosting ho tro.
