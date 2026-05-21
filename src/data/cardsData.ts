import { PirateCard } from '../types';

export const CHANCE_CARDS: PirateCard[] = [
  {
    id: "ch_1",
    type: "chance",
    title: "Badai Tropis!",
    text: "Kapal Anda dihantam badai besar di lautan karang. Mundur 3 petak untuk keselamatan kapal!",
    subtext: "Mundur 3 petak.",
    effect: { type: "move_by", amount: -3 }
  },
  {
    id: "ch_2",
    type: "chance",
    title: "Sarang Tortuga Menanti",
    text: "Angin laut yang menguntungkan meniup layar kapal Anda langsung menuju Surga Bajak Laut, Sarang Tortuga!",
    subtext: "Berlayar langsung ke Sarang Tortuga (Petak 11). Kumpulkan 200 koin emas jika melewati START.",
    effect: { type: "move_to", destinationId: 11, passGoChance: true }
  },
  {
    id: "ch_3",
    type: "chance",
    title: "Pemberontakan Kru!",
    text: "Kru kapal Anda hampir memberontak karena kehabisan daging asin dan rum jeruk. Bagikan koin emas untuk bersenang-senang!",
    subtext: "Bayar denda 50 koin emas.",
    effect: { type: "money", amount: -50 }
  },
  {
    id: "ch_4",
    type: "chance",
    title: "Peta Harta Karun Kuno",
    text: "Sesosok kerangka di dasar laut memegang peta ke Pulau Harta Karun. Berlayarlah ke sana sekarang juga!",
    subtext: "Pergi ke Pulau Harta Karun (Petak 37).",
    effect: { type: "move_to", destinationId: 37, passGoChance: true }
  },
  {
    id: "ch_5",
    type: "chance",
    title: "Meriam Rusak Meledak!",
    text: "Uji coba tembakan meriam baru merusak pondasi pondok bajak laut Anda. Perbaiki semuanya segera!",
    subtext: "Bayar 25 koin emas per Cabin dan 100 koin emas per Benteng Laut.",
    effect: { type: "repairs", houseCost: 25, hotelCost: 100 }
  },
  {
    id: "ch_6",
    type: "chance",
    title: "Pengampunan Raja",
    text: "Anda memenangkan duel minum melawan kapten Angkatan Laut Kerajaan. Diberikan piagam pengampunan denda laut!",
    subtext: "Dapatkan Gratis Keluar Penjara Laut Davy Jones. Simpan kartu ini.",
    effect: { type: "jail_free" }
  },
  {
    id: "ch_7",
    type: "chance",
    title: "Terseret Arus Kraken",
    text: "Pusaran air mengerikan menarik kapal Anda menuju lautan keramat. Seret jangkar langsung ke wilayah d'Davy Jones!",
    subtext: "Masuk Penjara Laut Davy Jones. Jangan lewati START, jangan kumpulkan 200 koin emas.",
    effect: { type: "jail" }
  },
  {
    id: "ch_8",
    type: "chance",
    title: "Sogok Angkatan Laut",
    text: "Kapal patroli Inggris bersenjata lengkap mencegat kemudi Anda. Berikan tip emas agar dibiarkan berlalu bebas.",
    subtext: "Bayar 15 Koin Emas.",
    effect: { type: "money", amount: -15 }
  }
];

export const COMMUNITY_CARDS: PirateCard[] = [
  {
    id: "cm_1",
    type: "community",
    title: "Menemukan Harta Karun Terkubur",
    text: "Kau menemukan peti harta karun tua di pulau terpencil setelah mengikuti peta rahasia kapten bajak laut dan berhak mendapatkan 100 emas!",
    subtext: "Dapatkan 100 koin emas!",
    effect: { type: "money", amount: 100 }
  },
  {
    id: "cm_2",
    type: "community",
    title: "Dirampok Bajak Laut Lain",
    text: "Saat malam berkabut, kru bajak laut lain mencuri persediaan emasmu! Kehilangan 100 emas",
    subtext: "Kehilangan 100 koin emas!",
    effect: { type: "money", amount: -100 }
  },
  {
    id: "cm_3",
    type: "community",
    title: "Diserang Kraken Laut",
    text: "Monster Kraken raksasa muncul dari laut dan merusak sebagian kapalmu. Bayar biaya perbaikan kapal sebesar 200 koin emas!",
    subtext: "Bayar denda 200 koin emas!",
    effect: { type: "money", amount: -200 }
  },
  {
    id: "cm_4",
    type: "community",
    title: "Angin Laut Menguntungkan",
    text: "Angin besar mendorong kapalmu melaju lebih cepat dari biasanya. Maju 5 langkah",
    subtext: "Maju ke depan 5 langkah",
    effect: { type: "move_by", amount: 5 }
  },
  {
    id: "cm_5",
    type: "community",
    title: "Menemukan Jalur Laut Rahasia",
    text: "Kau menemukan jalur laut tersembunyi yang membawa kapal menuju wilayah kaya. Pindah ke properti terdekat dan dapat beli tanpa lelang",
    subtext: "Pindah ke Isla de Providencia (Petak 23)",
    effect: { type: "move_to", destinationId: 23, passGoChance: true }
  },
  {
    id: "cm_6",
    type: "community",
    title: "Awak Kapal Memberontak",
    text: "Sebagian kru kapalmu menuntut lebih banyak emas dan membuat kekacauan di kapal. Lewati 1 giliran untuk menenangkan kru",
    subtext: "Masuk Penjara Laut (Kandang Besi)",
    effect: { type: "jail" }
  },
  {
    id: "cm_7",
    type: "community",
    title: "Kapal Hantu Muncul",
    text: "Kapal hantu legendaris muncul dari kabut dan memberimu peti penuh emas sebelum menghilang. Dapatkan 200 emas",
    subtext: "Dapatkan 200 koin emas!",
    effect: { type: "money", amount: 200 }
  },
  {
    id: "cm_8",
    type: "community",
    title: "Badai Laut Besar",
    text: "Badai ganas menghantam kapalmu dan menyeretmu ke wilayah penjara laut. Masuk ke Penjara",
    subtext: "Masuk Penjara Laut Davy Jones",
    effect: { type: "jail" }
  }
];
