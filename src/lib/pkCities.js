// Pakistani cities and towns for the checkout city list (Admin → Order & checkout → "Strict checks").
export const PK_CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Gujranwala","Sialkot","Hyderabad","Sargodha","Bahawalpur","Sukkur","Larkana","Sheikhupura","Jhang","Rahim Yar Khan","Gujrat","Kasur","Mardan","Mingora","Dera Ghazi Khan","Nawabshah","Sahiwal","Okara","Wah Cantt","Mirpur Khas","Chiniot","Kamoke","Burewala","Jhelum","Sadiqabad","Khanewal","Hafizabad","Kohat","Jacobabad","Shikarpur","Muzaffargarh","Khanpur","Gojra","Bahawalnagar","Abbottabad","Muridke","Pakpattan","Khuzdar","Jaranwala","Chishtian","Daska","Mandi Bahauddin","Ahmadpur East","Kamalia","Tando Adam","Khairpur","Dera Ismail Khan","Vehari","Nowshera","Dadu","Wazirabad","Charsadda","Swabi","Kot Addu","Mansehra","Chakwal","Gilgit","Skardu","Hunza","Muzaffarabad","Mirpur AJK","Kotli","Bhimber","Rawalakot","Attock","Taxila","Hassan Abdal","Haripur","Bannu","Karak","Lakki Marwat","Tank","Chitral","Dir","Battagram","Timergara","Havelian","Murree","Narowal","Toba Tek Singh","Layyah","Lodhran","Rajanpur","Mianwali","Bhakkar","Khushab","Talagang","Pindi Gheb","Fateh Jang","Kharian","Sambrial","Pasrur","Shakargarh","Gojar Khan","Dina","Kallar Syedan","Kahuta","Sohawa","Chichawatni","Arifwala","Haroonabad","Fort Abbas","Liaquatpur","Alipur","Jatoi","Mailsi","Dunyapur","Kabirwala","Shorkot","Samundri","Tandlianwala","Pattoki","Chunian","Raiwind","Manga Mandi","Nankana Sahib","Shahkot","Bhalwal","Sillanwali","Pind Dadan Khan","Gwadar","Turbat","Chaman","Zhob","Sibi","Hub","Loralai","Nushki","Kalat","Panjgur","Thatta","Badin","Tando Allahyar","Tando Muhammad Khan","Sanghar","Umerkot","Mithi","Ghotki","Kandhkot","Kashmore","Shahdadkot","Matiari","Hala","Jamshoro","Kotri","Gambat","Moro","Naushahro Feroze","Mehar","Ranipur","Sehwan","Bin Qasim","Malir","Gulshan-e-Iqbal","Defence Karachi","Gulberg Lahore","Bahria Town Lahore","Bahria Town Rawalpindi","DHA Lahore","DHA Islamabad",
];
export function findCity(v) {
  const t = String(v || "").trim().toLowerCase();
  return t ? PK_CITIES.find((c) => c.toLowerCase() === t) || null : null;
}
// Stricter checks used only when the admin switch is on.
export function strictPhone(phone) {
  const d = String(phone || "").replace(/[\s\-().]/g, "").replace(/^(?:\+92|0092|92)/, "0");
  if (!/^03\d{9}$/.test(d)) return false;
  const op = Number(d.slice(2, 4));
  if (!((op >= 0 && op <= 49) || op === 55)) return false; // real mobile prefixes: 0300–0349 and 0355
  const rest = d.slice(4);
  if (/^(\d)\1+$/.test(rest)) return false; // 0000000, 1111111 …
  if ("01234567890123456789".includes(rest) || "98765432109876543210".includes(rest)) return false; // 1234567 style
  return true;
}
export function strictName(name) {
  const w = String(name || "").trim().split(/\s+/).filter(Boolean);
  return w.length >= 2 && w.every((x) => /^[A-Za-z؀-ۿ.'\-]{2,}$/.test(x)) && !w.some((x) => /(.)\1{3,}/.test(x));
}
export function strictAddress(addr) {
  const a = String(addr || "").trim();
  const words = a.split(/\s+/).filter(Boolean);
  const real = words.filter((x) => /[A-Za-z؀-ۿ]{3,}/.test(x));
  return a.length >= 15 && /\d/.test(a) && words.length >= 3 && real.length >= 2 && !/(.)\1{3,}/.test(a) && !/^\d+$/.test(a.replace(/[\s,.\-/]/g, ""));
}
