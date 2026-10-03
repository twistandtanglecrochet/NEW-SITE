// Product catalog: the hard-coded starter products and their photos.
//
// To add a new product the same way existing ones are done: add a new
// `const SOMETHING_SRC = "data:image/...;base64,...";` line below (one per
// photo), then add a matching entry to SEED_PRODUCTS referencing it.
//
// Products added through the admin portal (public/admin.html) do NOT go
// here -- those live in Firestore and are merged in at runtime by App.jsx.
import { COLORS } from "./colors.js";

export const POUCH_FRONT_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011909/zwuxydvobbp7ptvidtcv.jpg";
export const POUCH_THREEQ_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011909/ncnvuls4eexpu0jybrxj.jpg";
export const POUCH_SIDE_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011910/xmrzgbb3yhesxshguvg7.jpg";
export const EARRING_EAR1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011911/e4clotzorm45kmuudfxg.jpg";
export const EARRING_EAR2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011911/rlacfqdtraadpvbhveoa.jpg";
export const EARRING_EAR3_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011912/fnfrmlcakuakmr2fus3x.jpg";
export const CLIP_YELLOW_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011913/lqifhfny7ek4hn0dbcgc.jpg";
export const CLIP_TAN_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011914/ptxkmjrsepwzpzhu4frh.jpg";
export const CLIP_CREAM_RED_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011914/qojxjssnxxuyh59mb73k.jpg";
export const CLIP_MAROON_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011915/exh6ktmksucg0dcebfhg.jpg";
export const CLIP_RED_GREEN_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011916/occgzkg7z6ka1ihlxobd.jpg";
export const CLIP_TEAL_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011917/lxjbsx2dxowfkzgt3jgx.jpg";
export const SUNFLOWER_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011917/zzpiz4ve5lgnfl2bgboy.jpg";
export const SUNFLOWER_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011918/ot2cjv7jiwngijvx88eg.jpg";
export const SUNFLOWER_3_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011919/mboeqrid7ewkxipwsbvj.jpg";
export const JERSEY_KEYCHAIN_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011920/lzlyw93bxfrqrdvmb2sw.jpg";
export const JERSEY_KEYCHAIN_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011921/uq7xtypnhj55dbja4y68.jpg";
export const JERSEY_KEYCHAIN_3_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011922/cl7tahi7qssexkeqfzcn.jpg";
export const JERSEY_KEYCHAIN_4_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011922/h8tdmwtubqs9wvnrr14y.jpg";
export const PINK_BOW_KEYCHAIN_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011923/fieq6rskayshh4splqif.jpg";
export const PINK_BOW_KEYCHAIN_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011924/kqpou3asae1enkpywdrx.jpg";
export const MINI_BAG_KEYCHAIN_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011924/kugwfniyr9q2wjk91xpp.jpg";
export const MINI_BAG_KEYCHAIN_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011925/a6ov2f0ob9775goyit0f.jpg";
export const MINI_BAG_KEYCHAIN_3_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011925/h8aku1avnomoeewdfzax.jpg";
export const HC2_YELLOW_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011926/z281atpa7d3knqedi43h.jpg";
export const HC2_ALL4_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011926/b8akgqro01p8nhstqy4o.jpg";
export const HC2_BEIGE_FLOWER_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011927/sav7hxblgrz8avy8myq5.jpg";
export const HC2_RED_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011928/kfwiyvb00hpwesanh1ev.jpg";
export const HC2_PINK_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011928/foukjsu5bmrjm0ytenjb.jpg";
export const HC_ALL4_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011929/vpke00fopr0dggi9rt63.jpg";
export const HC_GOLD_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011929/ahi0jbpipduxuywbo3f9.jpg";
export const HC_RED_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011930/s5iftezfk9eqkbgy4aw4.jpg";
export const HC_PINK_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011930/n7ier42y4ptyfd57xzvj.jpg";
export const HC_GREEN_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011931/r1uhjaz1nfljgwukyoiq.jpg";
export const MINI_HAT_KEYCHAIN_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011932/tf6wkwmpsefztjxwq0ht.jpg";
export const MINI_HAT_KEYCHAIN_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011933/prssxjajdjpan8hyrdhe.jpg";
export const MINI_HAT_KEYCHAIN_3_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011933/bgqilkwbswfunyukkejf.jpg";
export const PONY_RING_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011934/om6akbc6mwfrpflnsrkz.jpg";
export const PONY_RED_YELLOW_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011936/c2o6c0xo6wmsu6acsz5l.jpg";
export const PONY_ORANGE_BROWN_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011936/vdmvyksqkebzmqvhxups.jpg";
export const PONY_PINK_TEAL_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011937/qpzm0mqg80c0re894xqb.jpg";
export const PONY_GREEN_RED_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011938/dl0v83iyzxwll9uiaej9.jpg";
export const ROSE_KEYCHAIN_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011939/rer3shkxct70j0nco8sl.jpg";
export const ROSE_KEYCHAIN_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011939/ders9tcr0wgnq67zudox.jpg";
export const ROSE_KEYCHAIN_3_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011940/eituauh0zdlaoyyzepzs.jpg";
export const ROSE_CHARM_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011940/v2ae1ir80ebv7ias8s8h.jpg";
export const ROSE_CHARM_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011941/dzahcad0jqksjpketibr.jpg";
export const HAIR_CLAW_2_1_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011942/hnrep9pw7u82yg8uriss.jpg";
export const HAIR_CLAW_2_2_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011943/ajdid6banrap8otfgxtr.jpg";

export const HC3_ALL6_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011943/sptprkevlqcicmfuuevp.jpg";
export const HC3_MINT_PINK_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011944/i7b0qsiutinhoys4urhg.jpg";
export const HC3_GREEN_RED_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011945/suul3afymwd9ruddjs6r.jpg";
export const HC3_BLUE_CREAM_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011945/eytfnr31bwvozxxw59pu.jpg";
export const HC3_TEAL_MAROON_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011946/a73yiijn4dariblxkxgr.jpg";
export const HC3_CORAL_NAVY_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011947/q9bat3yvbxg3m6jwhne2.jpg";
export const HC3_MAROON_CREAM_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011947/du6fqpb2wiuaz83002sw.jpg";
export const AIRPODS_POUCH_FLAT_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011948/jvgslfswea3o8skixsjm.jpg";
export const AIRPODS_POUCH_OPEN_SRC = "https://res.cloudinary.com/kqcnm3ge/image/upload/v1791011949/mxvxa5jjw5hszs6pjexu.jpg";
export const SEED_PRODUCTS = [
  {
    id: "p22",
    name: "Crochet Flower Claw Clip",
    price: 250,
    tag: "New",
    category: "Hair Clips",
    variants: [
      { name: "Olive Square Clip, Red & Tan Flower", photo: HAIR_CLAW_2_1_SRC },
      { name: "Maroon Wrapped Clip, Yellow Flower", photo: HAIR_CLAW_2_2_SRC },
    ],
    swatch: [COLORS.maroon, COLORS.gold],
    desc: "Hand-crocheted flower claw clips — available in two styles. Tap a thumbnail to preview each one.",
    real: true,
  },
  {
    id: "p21",
    name: "Crochet Rose Bag/Phone Charm",
    price: 400,
    tag: "New",
    category: "Bag & Phone Charms",
    photos: [ROSE_CHARM_1_SRC, ROSE_CHARM_2_SRC],
    swatch: [COLORS.cream, "#0B3D2E"],
    desc: "Hand-crocheted ivory rose charm with dark green leaf accents, on a cord loop — perfect for a bag, phone, or AirPods case.",
    real: true,
  },
  {
    id: "p20",
    name: "Crochet Rose Keychain",
    price: 450,
    tag: "New",
    category: "Crochet Keychains",
    photos: [ROSE_KEYCHAIN_1_SRC, ROSE_KEYCHAIN_2_SRC, ROSE_KEYCHAIN_3_SRC],
    swatch: [COLORS.maroon, COLORS.navy],
    desc: "Hand-crocheted rose keychain in deep maroon, finished with a sturdy keyring — an elegant everyday accessory or gift.",
    real: true,
  },
  {
    id: "p19",
    name: "Crochet Pony (Set of 2)",
    price: 300,
    tag: "New",
    category: "Hair Ties",
    variants: [
      { name: "Red & Yellow Scallop Ring", photo: PONY_RING_SRC },
      { name: "Red Band, Yellow Bow", photo: PONY_RED_YELLOW_SRC },
      { name: "Orange Band, Red & Brown Bow", photo: PONY_ORANGE_BROWN_SRC },
      { name: "Pink Band, Teal Bow", photo: PONY_PINK_TEAL_SRC },
      { name: "Green Band, Red Bow", photo: PONY_GREEN_RED_SRC },
    ],
    swatch: [COLORS.maroon, COLORS.gold],
    desc: "Hand-crocheted hair ties, sold as a set of 2 — a scalloped ring style or a cute bow-topped ponytail band, available in several color combinations. Tap a thumbnail to preview each one.",
    real: true,
  },
  {
    id: "p18",
    name: "Crochet Mini Hat Keychain",
    price: 450,
    tag: "New",
    category: "Crochet Keychains",
    photos: [MINI_HAT_KEYCHAIN_1_SRC, MINI_HAT_KEYCHAIN_2_SRC, MINI_HAT_KEYCHAIN_3_SRC],
    swatch: [COLORS.cream, "#0F7B7B"],
    desc: "Hand-crocheted mini sun-hat keychain in ivory and teal — a cute, unique charm for bags or keys.",
    real: true,
  },
  {
    id: "p17",
    name: "Crochet Flower Hair Catcher",
    price: 250,
    tag: "New",
    category: "Hair Clips",
    variants: [
      { name: "All 4 Catchers", photo: HC_ALL4_SRC },
      { name: "Gold & Red", photo: HC_GOLD_SRC },
      { name: "Red & Gold", photo: HC_RED_SRC },
      { name: "Pink", photo: HC_PINK_SRC },
      { name: "Green", photo: HC_GREEN_SRC },
    ],
    swatch: [COLORS.maroon, COLORS.gold],
    desc: "Hand-crocheted flower hair catcher (claw clip) — available in gold & red, red & gold, pink, or green. Tap a thumbnail to preview each color.",
    real: true,
  },
  {
    id: "p23",
    name: "Crochet Loop Hair Claw Clip",
    price: 250,
    tag: "New",
    category: "Hair Clips",
    variants: [
      { name: "All 4 Colors", photo: HC2_ALL4_SRC },
      { name: "Yellow", photo: HC2_YELLOW_SRC },
      { name: "Red", photo: HC2_RED_SRC },
      { name: "Pink", photo: HC2_PINK_SRC },
      { name: "Beige with Red Flower", photo: HC2_BEIGE_FLOWER_SRC },
    ],
    swatch: [COLORS.gold, COLORS.maroon],
    desc: "Hand-crocheted loop-style hair claw clip — available in yellow, red, pink, or beige with a red flower. Tap a thumbnail to preview each color.",
    real: true,
  },
  {
    id: "p24",
    name: "Crochet Scalloped Flower Claw Clip",
    price: 400,
    tag: "New",
    category: "Hair Clips",
    variants: [
      { name: "All 6 Colors", photo: HC3_ALL6_SRC },
      { name: "Teal & Maroon", photo: HC3_TEAL_MAROON_SRC },
      { name: "Cream & Maroon", photo: HC3_MAROON_CREAM_SRC },
      { name: "Green & Red", photo: HC3_GREEN_RED_SRC },
      { name: "Blue & Cream", photo: HC3_BLUE_CREAM_SRC },
      { name: "Mint & Pink", photo: HC3_MINT_PINK_SRC },
      { name: "Coral & Navy", photo: HC3_CORAL_NAVY_SRC },
    ],
    swatch: [COLORS.maroon, "#0F7B7B"],
    desc: "Hand-crocheted scalloped flower claw clip — available in six two-tone color combinations. Tap a thumbnail to preview each one.",
    real: true,
  },
  {
    id: "p25",
    name: "Crochet AirPods Pouch",
    price: 500,
    tag: "New",
    category: "Crochet Purses",
    photos: [AIRPODS_POUCH_FLAT_SRC, AIRPODS_POUCH_OPEN_SRC],
    swatch: ["#1565C0", "#0D47A1"],
    desc: "Hand-crocheted AirPods pouch in royal blue, finished with a sturdy wrist loop — a snug, handy carrier for your earbuds on the go.",
    real: true,
  },
  {
    id: "p1",
    name: "Maroon Bloom Pouch",
    price: 1000,
    tag: "Bestseller",
    category: "Crochet Purses",
    photos: [POUCH_FRONT_SRC, POUCH_THREEQ_SRC, POUCH_SIDE_SRC],
    swatch: [COLORS.maroon, COLORS.blushSoft],
    desc: "A hand-stitched drawstring pouch with two crochet blossoms — deep maroon body, blush trim. Handy for carrying cash, AirPods, cosmetics, and other small essentials.",
    sizes: ["Small", "Medium", "Large"],
    real: true,
  },
  {
    id: "p3",
    name: "Yellow Crochet Hoop Earrings",
    price: 500,
    tag: "New",
    category: "Crochet Earrings",
    photos: [EARRING_EAR1_SRC, EARRING_EAR2_SRC, EARRING_EAR3_SRC],
    swatch: [COLORS.gold, COLORS.navy],
    desc: "Hand-crocheted mustard-yellow hoop earrings finished with red beaded trim and gold-tone hooks.",
    real: true,
  },
  {
    id: "p4",
    name: "Sunflower Keychain",
    price: 500,
    tag: "New",
    category: "Crochet Keychains",
    photos: [SUNFLOWER_1_SRC, SUNFLOWER_2_SRC, SUNFLOWER_3_SRC],
    swatch: [COLORS.gold, "#3B2A1A"],
    desc: "Hand-crocheted sunflower keychain with a deep brown center, finished with a sturdy keyring.",
    real: true,
  },
  {
    id: "p14",
    name: "Mini Jersey Keychain (No. 10)",
    price: 500,
    tag: "New",
    category: "Crochet Keychains",
    photos: [JERSEY_KEYCHAIN_1_SRC, JERSEY_KEYCHAIN_2_SRC, JERSEY_KEYCHAIN_3_SRC, JERSEY_KEYCHAIN_4_SRC],
    swatch: [COLORS.navy, COLORS.cream],
    desc: "Hand-crocheted mini football jersey keychain in blue and white with a No. 10 detail — a fun gift for any football fan.",
    real: true,
  },
  {
    id: "p15",
    name: "Pink Bow Keychain",
    price: 450,
    tag: "New",
    category: "Crochet Keychains",
    photos: [PINK_BOW_KEYCHAIN_1_SRC, PINK_BOW_KEYCHAIN_2_SRC],
    swatch: [COLORS.blushSoft, COLORS.navy],
    desc: "Hand-crocheted pink bow keychain, finished with a sturdy keyring — a sweet everyday accessory or gift.",
    real: true,
  },
  {
    id: "p16",
    name: "Mini Bag Keychain",
    price: 450,
    tag: "New",
    category: "Crochet Keychains",
    photos: [MINI_BAG_KEYCHAIN_1_SRC, MINI_BAG_KEYCHAIN_2_SRC, MINI_BAG_KEYCHAIN_3_SRC],
    swatch: [COLORS.gold, "#3B2A1A"],
    desc: "Hand-crocheted mini bag keychain in mustard yellow with a fun stitched face — a playful, unique accessory.",
    real: true,
  },
  {
    id: "p8",
    name: "Crochet Hair Clips",
    price: 550,
    tag: "New",
    category: "Hair Clips",
    variants: [
      { name: "Mustard & White", photo: CLIP_YELLOW_SRC },
      { name: "Tan & Blue Pearl", photo: CLIP_TAN_SRC },
      { name: "Cream & Red", photo: CLIP_CREAM_RED_SRC },
      { name: "Maroon & Ivory", photo: CLIP_MAROON_SRC },
      { name: "Red & Green Beaded", photo: CLIP_RED_GREEN_SRC },
      { name: "Ivory & Teal", photo: CLIP_TEAL_SRC },
    ],
    swatch: [COLORS.gold, COLORS.cream],
    desc: "Hand-crocheted hair clip pairs, each topped with a crochet flower — available in six color combinations. Tap a thumbnail to preview each one.",
    real: true,
  },
];
