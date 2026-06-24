import { User, ContentItem, CommunityPost, CommunityComment, LanguageComparison } from '../types'

export const demoUser: User = {
  id: 'u1',
  email: 'ahmet@turan.app',
  display_name: 'Ahmet Yılmaz',
  username: 'ahmetyilmaz',
  country: 'Türkiye',
  city: 'İstanbul',
  bio: 'Türk dünyası kültürüne meraklı bir gezgin.',
  avatar_url: '',
  app_language: 'tr',
  theme: 'dark',
  membership_status: 'member',
  created_at: '2024-01-15',
}

const demoUsers: User[] = [
  demoUser,
  {
    id: 'u2', email: 'leyla@turan.app', display_name: 'Leyla Əliyeva', username: 'leyla_az',
    country: 'Azərbaycan', city: 'Bakı', bio: 'Mədəniyyət araşdırmaçısı.',
    avatar_url: '', app_language: 'az', theme: 'dark', membership_status: 'member', created_at: '2024-02-10',
  },
  {
    id: 'u3', email: 'aibek@turan.app', display_name: 'Айбек Серікұлы', username: 'aibek_kz',
    country: 'Қазақстан', city: 'Алматы', bio: 'Тарихшы, жазушы.',
    avatar_url: '', app_language: 'kk', theme: 'dark', membership_status: 'member', created_at: '2024-03-05',
  },
]

export const demoContents: ContentItem[] = [
  {
    id: 'c1', category_id: 'history', title: 'Göktürk Kağanlığı',
    short_description: '552 yılında kurulan ilk büyük Türk devleti.',
    content: 'Göktürk Kağanlığı, 552 yılında Bumin Kağan tarafından kurulmuştur. Orta Asya\'nın büyük bir bölümünü kontrol eden bu devlet, Türk tarihinin en önemli siyasi oluşumlarından biridir. Orhun Yazıtları bu dönemin en değerli kültürel mirasıdır. Göktürkler, Türk dilinin ilk yazılı belgelerini bırakmışlardır. Bilge Kağan ve Kül Tigin döneminde devlet en parlak çağını yaşamıştır.',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'history',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
  {
    id: 'c2', category_id: 'culture', title: 'Nevruz Bayramı',
    short_description: 'Türk dünyasının ortak bahar bayramı.',
    content: 'Nevruz, 21 Mart\'ta kutlanan ve Türk dünyasının ortak bayramıdır. Yeni yılın başlangıcı olarak kabul edilen bu gün, baharın gelişini simgeler. Kazakistan\'da Naurız, Azerbaycan\'da Novruz, Özbekistan\'da Navro\'z olarak bilinir. Geleneksel yemekler hazırlanır, ateş yakılır ve topluluklar bir araya gelir. UNESCO tarafından İnsanlığın Somut Olmayan Kültürel Mirası olarak tescil edilmiştir.',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'culture',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
  {
    id: 'c3', category_id: 'personalities', title: 'Ali Şir Nevai',
    short_description: 'Çağatay Türkçesinin en büyük şairi.',
    content: 'Ali Şir Nevai (1441-1501), Çağatay Türkçesinin en büyük şairi ve düşünürüdür. Herat\'ta doğmuş, Timurlu sarayında yetişmiştir. "Muhakemetül Lugateyn" adlı eserinde Türkçenin Farsçadan üstün olduğunu savunmuştur. Beş mesneviden oluşan "Hamse" adlı eseri, Türk edebiyatının en önemli yapıtlarından biridir. Nevai, Türk dilinin bir edebiyat dili olarak yükselmesinde büyük rol oynamıştır.',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'personality',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
  {
    id: 'c4', category_id: 'cities', title: 'Semerkant',
    short_description: 'İpek Yolu\'nun incisi, tarih kokan şehir.',
    content: 'Semerkant, Özbekistan\'ın en kadim şehirlerinden biridir. 2750 yıllık tarihe sahip olan şehir, İpek Yolu\'nun en önemli duraklarından biri olmuştur. Timur İmparatorluğu\'nun başkenti olarak görkemli yapılarla donatılmıştır. Registan Meydanı, Bibi Hanım Camii ve Şah-ı Zinde Nekropolü UNESCO Dünya Mirası listesindedir. Uluğ Bey\'in kurduğu rasathane, dönemin en gelişmiş astronomi merkeziydi.',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'city',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
  {
    id: 'c5', category_id: 'language', title: 'Türk Dillerinde Sayılar',
    short_description: 'Altı Türk dilinde sayıların karşılaştırması.',
    content: 'Türk dilleri arasında sayı sistemleri büyük benzerlikler gösterir. Bu benzerlik, ortak bir kökene işaret eder ve diller arasındaki akrabalığı açıkça ortaya koyar.',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'words',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
  {
    id: 'c6', category_id: 'news', title: 'Türk Devletleri Teşkilatı Zirvesi',
    short_description: 'Türk dünyası liderleri ortak projeler için bir araya geldi.',
    content: 'Türk Devletleri Teşkilatı üye ülkelerinin liderleri, kültürel işbirliği ve ortak tarih projelerini görüşmek üzere bir araya geldi. Zirvede eğitim, kültür, ulaşım ve ticaret alanlarında yeni anlaşmalar imzalandı. Ortak alfabe çalışmaları ve dijital platform projeleri de gündeme geldi.',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'news',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
  {
    id: 'c7', category_id: 'history', title: 'Orhun Yazıtları',
    short_description: 'Türk dilinin bilinen en eski yazılı belgeleri.',
    content: 'Orhun Yazıtları, 8. yüzyılda Göktürk döneminde dikilen anıtlardır. Moğolistan\'daki Orhun Vadisi\'nde bulunan bu yazıtlar, Bilge Kağan, Kül Tigin ve vezir Tonyukuk adına dikilmiştir. Türk tarihinin, kültürünün ve dilinin en önemli kaynaklarından biridir.',
    image_url: '', language: 'tr', show_in_daily_feed: false,
    published_at: '2024-06-22', created_at: '2024-06-18',
  },
  {
    id: 'c8', category_id: 'literature', title: 'Dede Korkut Kitabı',
    short_description: 'Oğuz Türklerinin destansı hikâyeleri.',
    content: 'Dede Korkut Kitabı, Oğuz Türklerinin destansı hikâyelerini içeren bir eserdir. 12 hikâyeden oluşan kitap, Türk toplumunun değerlerini, kahramanlık anlayışını ve aile yapısını yansıtır. UNESCO İnsanlığın Somut Olmayan Kültürel Mirası listesindedir.',
    image_url: '', language: 'tr', show_in_daily_feed: false,
    published_at: '2024-06-21', created_at: '2024-06-17',
  },
  {
    id: 'c9', category_id: 'traditions', title: 'Kımız Geleneği',
    short_description: 'Orta Asya Türklerinin geleneksel içeceği.',
    content: 'Kımız, kısrak sütünden yapılan fermente bir içecektir. Kazak, Kırgız ve diğer Orta Asya Türk topluluklarında binlerce yıldır üretilmektedir. Sağlık açısından faydalı kabul edilen kımız, misafirperverliğin de simgesidir.',
    image_url: '', language: 'tr', show_in_daily_feed: false,
    published_at: '2024-06-20', created_at: '2024-06-16',
  },
  {
    id: 'c10', category_id: 'culture', title: 'Türk Halı Sanatı',
    short_description: 'Dünyaca ünlü Türk halı dokuma geleneği.',
    content: 'Türk halı sanatı, binlerce yıllık bir geleneğe sahiptir. Türkmen halıları, Anadolu kilimleri, Azerbaycan halıları ve Özbek süzeni işlemeleri bu sanatın farklı kollarını temsil eder. Her bölgenin kendine özgü motif ve renk paleti vardır.',
    image_url: '', language: 'tr', show_in_daily_feed: false,
    published_at: '2024-06-19', created_at: '2024-06-15',
  },
  {
    id: 'c11', category_id: 'history', title: 'Büyük Selçuklu Devleti',
    short_description: 'Orta Çağ İslam dünyasının en güçlü Türk devleti.',
    content: 'Büyük Selçuklu Devleti, 1037-1194 yılları arasında hüküm sürmüştür. Tuğrul Bey tarafından kurulan devlet, Alp Arslan döneminde 1071 Malazgirt Savaşı ile Anadolu\'nun kapılarını Türklere açmıştır. Melikşah ve Nizamülmülk döneminde devlet en parlak çağını yaşamıştır.',
    image_url: '', language: 'tr', show_in_daily_feed: false,
    published_at: '2024-06-18', created_at: '2024-06-14',
  },
  {
    id: 'c12', category_id: 'quote', title: 'Bilge Kağan Sözü',
    short_description: 'Bilge Kağan\'ın milletine seslenişi.',
    content: '"Üstte mavi gök çökmedikçe, altta yağız yer delinmedikçe, senin ilini ve töreni kim bozabilir?" — Bilge Kağan, Orhun Yazıtları',
    image_url: '', language: 'tr', show_in_daily_feed: true, daily_feed_type: 'quote',
    published_at: '2024-06-23', created_at: '2024-06-20',
  },
]

export const demoPosts: CommunityPost[] = [
  {
    id: 'p1', user_id: 'u1', user: demoUsers[0],
    text: 'Bugün Orhun Yazıtları hakkında harika bir belgesel izledim. Göktürklerin bıraktığı bu miras inanılmaz!',
    likes_count: 12, comments_count: 3, reposts_count: 2,
    created_at: '2024-06-23T10:30:00', is_liked: false, is_saved: false,
  },
  {
    id: 'p2', user_id: 'u2', user: demoUsers[1],
    text: 'Bakıda Novruz bayramı hazırlıqları başladı. Səməni göyərtmək vaxtıdır! 🌱',
    likes_count: 24, comments_count: 5, reposts_count: 4,
    created_at: '2024-06-23T09:15:00', is_liked: false, is_saved: false,
  },
  {
    id: 'p3', user_id: 'u3', user: demoUsers[2],
    text: 'Қазақ тілін үйренуге арналған жаңа қосымша шықты. Барлық түркі тілдерін салыстыруға мүмкіндік береді.',
    likes_count: 18, comments_count: 7, reposts_count: 3,
    created_at: '2024-06-22T20:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'p4', user_id: 'u1', user: demoUsers[0],
    text: 'Semerkant\'a gidip Registan Meydanı\'nı gördüm. Timur\'un mirası gerçekten büyüleyici. Herkesin görmesi gereken bir yer.',
    likes_count: 31, comments_count: 8, reposts_count: 6,
    created_at: '2024-06-22T15:45:00', is_liked: false, is_saved: false,
  },
  {
    id: 'p5', user_id: 'u2', user: demoUsers[1],
    text: 'Türk dünyasının ortaq mədəni irsini qorumaq üçün daha çox işlər görməliyik. Birlik gücdür!',
    likes_count: 45, comments_count: 12, reposts_count: 9,
    created_at: '2024-06-21T12:00:00', is_liked: false, is_saved: false,
  },
]

export const demoComments: CommunityComment[] = [
  { id: 'cm1', post_id: 'p1', user_id: 'u2', user: demoUsers[1], text: 'Çox maraqlı paylaşım! Belgeseli adını paylaşa bilərsən?', created_at: '2024-06-23T11:00:00' },
  { id: 'cm2', post_id: 'p1', user_id: 'u3', user: demoUsers[2], text: 'Орхон жазбалары — біздің ортақ мұрамыз!', created_at: '2024-06-23T11:30:00' },
  { id: 'cm3', post_id: 'p2', user_id: 'u1', user: demoUsers[0], text: 'Nevruz tüm Türk dünyasının ortak bayramı. Kutlu olsun!', created_at: '2024-06-23T09:45:00' },
  { id: 'cm4', post_id: 'p4', user_id: 'u2', user: demoUsers[1], text: 'Səmərqənd həqiqətən möhtəşəm bir şəhərdir!', created_at: '2024-06-22T16:30:00' },
  { id: 'cm5', post_id: 'p4', user_id: 'u3', user: demoUsers[2], text: 'Самарқанд — Ұлықбектің жұлдыздарды бақылаған қаласы.', created_at: '2024-06-22T17:00:00' },
]

export const demoLanguageComparisons: LanguageComparison[] = [
  { id: 'lc1', meaning: 'Su', tr: 'Su', az: 'Su', kk: 'Су', ky: 'Суу', uz: 'Suv', tk: 'Suw' },
  { id: 'lc2', meaning: 'Ateş', tr: 'Ateş', az: 'Od', kk: 'От', ky: 'От', uz: 'Olov', tk: 'Ot' },
  { id: 'lc3', meaning: 'Gök', tr: 'Gök', az: 'Göy', kk: 'Көк', ky: 'Көк', uz: "Ko'k", tk: 'Gök' },
  { id: 'lc4', meaning: 'Yer', tr: 'Yer', az: 'Yer', kk: 'Жер', ky: 'Жер', uz: 'Yer', tk: 'Ýer' },
  { id: 'lc5', meaning: 'Dağ', tr: 'Dağ', az: 'Dağ', kk: 'Тау', ky: 'Тоо', uz: "Tog'", tk: 'Dag' },
  { id: 'lc6', meaning: 'Yol', tr: 'Yol', az: 'Yol', kk: 'Жол', ky: 'Жол', uz: "Yo'l", tk: 'Ýol' },
  { id: 'lc7', meaning: 'Ev', tr: 'Ev', az: 'Ev', kk: 'Үй', ky: 'Үй', uz: 'Uy', tk: 'Öý' },
  { id: 'lc8', meaning: 'At', tr: 'At', az: 'At', kk: 'Ат', ky: 'Ат', uz: 'Ot', tk: 'At' },
  { id: 'lc9', meaning: 'Göz', tr: 'Göz', az: 'Göz', kk: 'Көз', ky: 'Көз', uz: "Ko'z", tk: 'Göz' },
  { id: 'lc10', meaning: 'Kalp', tr: 'Yürek', az: 'Ürək', kk: 'Жүрек', ky: 'Жүрөк', uz: 'Yurak', tk: 'Ýürek' },
  { id: 'lc11', meaning: 'Bey', tr: 'Bey', az: 'Bəy', kk: 'Бек', ky: 'Бек', uz: 'Bek', tk: 'Beg' },
  { id: 'lc12', meaning: 'Kardeş', tr: 'Kardeş', az: 'Qardaş', kk: 'Бауыр', ky: 'Бир тууган', uz: 'Aka/uka', tk: 'Dogan' },
]
