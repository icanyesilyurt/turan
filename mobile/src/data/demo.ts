import { User, CommunityPost, CommunityComment, Conversation, DirectMessage, AppNotification } from '../types'

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
  followers_count: 142,
  following_count: 89,
}

export const demoUsers: User[] = [
  demoUser,
  {
    id: 'u2', email: 'leyla@turan.app', display_name: 'Leyla Əliyeva', username: 'leyla_az',
    country: 'Azərbaycan', city: 'Bakı', bio: 'Mədəniyyət araşdırmaçısı. Bakı Dövlət Universitetində tarix müəlliməsi.',
    avatar_url: '', app_language: 'az', theme: 'dark', membership_status: 'member',
    created_at: '2024-02-10', followers_count: 231, following_count: 104,
  },
  {
    id: 'u3', email: 'aibek@turan.app', display_name: 'Айбек Серікұлы', username: 'aibek_kz',
    country: 'Қазақстан', city: 'Алматы', bio: 'Тарихшы, жазушы. Түркі халықтарының ортақ тарихын зерттеймін.',
    avatar_url: '', app_language: 'kk', theme: 'dark', membership_status: 'member',
    created_at: '2024-03-05', followers_count: 318, following_count: 76,
  },
  {
    id: 'u4', email: 'turan@turan.app', display_name: 'TURAN', username: 'turan',
    country: '', city: '', bio: 'Türk Dünyası Kültür ve Topluluk Platformu. Resmi hesap.',
    avatar_url: '', app_language: 'tr', theme: 'dark', membership_status: 'admin',
    created_at: '2024-01-01', followers_count: 12500, following_count: 0,
  },
  {
    id: 'u5', email: 'elif@turan.app', display_name: 'Elif Demir', username: 'elif_tr',
    country: 'Türkiye', city: 'Ankara', bio: 'Dil bilimci. Türk dilleri üzerine çalışıyorum.',
    avatar_url: '', app_language: 'tr', theme: 'dark', membership_status: 'member',
    created_at: '2024-04-12', followers_count: 89, following_count: 145,
  },
  {
    id: 'u6', email: 'timur@turan.app', display_name: 'Timur Karimov', username: 'timur_uz',
    country: "O'zbekiston", city: 'Toshkent', bio: "Tarixchi va yozuvchi. O'zbek madaniyatini targ'ib qilaman.",
    avatar_url: '', app_language: 'uz', theme: 'dark', membership_status: 'member',
    created_at: '2024-05-20', followers_count: 167, following_count: 92,
  },
]

export const officialUser = demoUsers[3]

export const followingUserIds = ['u2', 'u3']

export const officialPosts: CommunityPost[] = [
  {
    id: 'op1', user_id: 'u4', user: officialUser, is_official: true,
    text: '"Üstte mavi gök çökmedikçe, altta yağız yer delinmedikçe, senin ilini ve töreni kim bozabilir?"\n\n— Bilge Kağan, Orhun Yazıtları',
    likes_count: 284, comments_count: 18, reposts_count: 45,
    created_at: '2024-06-24T08:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'op2', user_id: 'u4', user: officialUser, is_official: true,
    text: 'Göktürk Kağanlığı, 552 yılında Bumin Kağan tarafından kuruldu.\n\nOrta Asya\'nın büyük bir bölümünü kontrol eden bu devlet, Türk tarihinin en önemli siyasi oluşumlarından biridir. Orhun Yazıtları bu dönemin en değerli kültürel mirasıdır.',
    likes_count: 196, comments_count: 12, reposts_count: 33,
    created_at: '2024-06-24T07:30:00', is_liked: false, is_saved: false,
  },
  {
    id: 'op3', user_id: 'u4', user: officialUser, is_official: true,
    text: 'Nevruz, 21 Mart\'ta kutlanan Türk dünyasının ortak bayramıdır.\n\nKazakistan\'da Naurız, Azerbaycan\'da Novruz, Özbekistan\'da Navro\'z olarak bilinir. UNESCO tarafından İnsanlığın Somut Olmayan Kültürel Mirası olarak tescil edilmiştir.',
    likes_count: 342, comments_count: 24, reposts_count: 67,
    created_at: '2024-06-23T09:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'op4', user_id: 'u4', user: officialUser, is_official: true,
    text: 'Ali Şir Nevai (1441-1501), Çağatay Türkçesinin en büyük şairi ve düşünürüdür.\n\n"Muhakemetül Lugateyn" adlı eserinde Türkçenin Farsçadan üstün olduğunu savunmuştur. Türk dilinin bir edebiyat dili olarak yükselmesinde büyük rol oynamıştır.',
    likes_count: 178, comments_count: 9, reposts_count: 28,
    created_at: '2024-06-22T10:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'op5', user_id: 'u4', user: officialUser, is_official: true,
    text: 'Türk Devletleri Teşkilatı üye ülkelerinin liderleri, kültürel işbirliği ve ortak tarih projelerini görüşmek üzere bir araya geldi.\n\nZirvede eğitim, kültür, ulaşım ve ticaret alanlarında yeni anlaşmalar imzalandı.',
    likes_count: 412, comments_count: 31, reposts_count: 89,
    created_at: '2024-06-21T14:00:00', is_liked: false, is_saved: false,
  },
]

export const followingPosts: CommunityPost[] = [
  {
    id: 'fp1', user_id: 'u2', user: demoUsers[1],
    text: 'Bakıda Novruz bayramı hazırlıqları başladı. Səməni göyərtmək vaxtıdır! 🌱',
    likes_count: 24, comments_count: 5, reposts_count: 4,
    created_at: '2024-06-24T09:15:00', is_liked: false, is_saved: false,
  },
  {
    id: 'fp2', user_id: 'u3', user: demoUsers[2],
    text: 'Қазақ тілін үйренуге арналған жаңа қосымша шықты. Барлық түркі тілдерін салыстыруға мүмкіндік береді.',
    likes_count: 18, comments_count: 7, reposts_count: 3,
    created_at: '2024-06-23T20:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'fp3', user_id: 'u2', user: demoUsers[1],
    text: 'Türk dünyasının ortaq mədəni irsini qorumaq üçün daha çox işlər görməliyik. Birlik gücdür! 💪',
    likes_count: 45, comments_count: 12, reposts_count: 9,
    created_at: '2024-06-22T12:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'fp4', user_id: 'u3', user: demoUsers[2],
    text: 'Бүгін Алматыда түркі мәдениетіне арналған көрме ашылды. Қазақ, қырғыз, өзбек өнері бір жерде! 🎨',
    likes_count: 33, comments_count: 4, reposts_count: 7,
    created_at: '2024-06-21T16:00:00', is_liked: false, is_saved: false,
  },
]

export const explorePosts: CommunityPost[] = [
  {
    id: 'ep1', user_id: 'u5', user: demoUsers[4],
    text: 'Türk dillerindeki ortak kökleri araştırıyorum. "Su" kelimesi neredeyse tüm Türk dillerinde aynı: su, suv, suw. Binlerce yıllık ortak miras! 💧',
    likes_count: 67, comments_count: 14, reposts_count: 12,
    created_at: '2024-06-24T11:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'ep2', user_id: 'u6', user: demoUsers[5],
    text: "Samarqand Registon maydonini ko'rdim. Temurning merosi haqiqatan ham ajoyib. Har bir kishi ko'rishi kerak bo'lgan joy. 🕌",
    likes_count: 52, comments_count: 8, reposts_count: 11,
    created_at: '2024-06-24T10:30:00', is_liked: false, is_saved: false,
  },
  {
    id: 'ep3', user_id: 'u1', user: demoUsers[0],
    text: 'Bugün Orhun Yazıtları hakkında harika bir belgesel izledim. Göktürklerin bıraktığı bu miras inanılmaz!',
    likes_count: 12, comments_count: 3, reposts_count: 2,
    created_at: '2024-06-24T10:30:00', is_liked: false, is_saved: false,
  },
  {
    id: 'ep4', user_id: 'u5', user: demoUsers[4],
    text: '"Dede Korkut" destanının yeni bulunan 13. hikâyesi akademik çevrelerde büyük heyecan yarattı. Türk dünyasının ortak kültürel mirası her geçen gün zenginleşiyor.',
    likes_count: 89, comments_count: 19, reposts_count: 22,
    created_at: '2024-06-23T14:00:00', is_liked: false, is_saved: false,
  },
  {
    id: 'ep5', user_id: 'u6', user: demoUsers[5],
    text: "O'zbek oshxonasining eng mashhur taomlari haqida blog yozdim. Palov, manti, somsa — hammasi turkiy xalqlarning umumiy taomlari!",
    likes_count: 41, comments_count: 6, reposts_count: 8,
    created_at: '2024-06-22T18:00:00', is_liked: false, is_saved: false,
  },
]

export const demoComments: CommunityComment[] = [
  { id: 'cm1', post_id: 'op1', user_id: 'u2', user: demoUsers[1], text: 'Çox güclü sözlər!', likes_count: 0, reposts_count: 0, replies_count: 0, created_at: '2024-06-24T11:00:00' },
  { id: 'cm2', post_id: 'op1', user_id: 'u3', user: demoUsers[2], text: 'Орхон жазбалары — біздің ортақ мұрамыз!', likes_count: 0, reposts_count: 0, replies_count: 0, created_at: '2024-06-24T11:30:00' },
  { id: 'cm3', post_id: 'fp1', user_id: 'u1', user: demoUsers[0], text: 'Nevruz tüm Türk dünyasının ortak bayramı. Kutlu olsun!', likes_count: 0, reposts_count: 0, replies_count: 0, created_at: '2024-06-24T09:45:00' },
  { id: 'cm4', post_id: 'ep1', user_id: 'u3', user: demoUsers[2], text: 'Қазақша да "Су" деп айтамыз. Ортақтығымыз айқын!', likes_count: 0, reposts_count: 0, replies_count: 0, created_at: '2024-06-24T12:00:00' },
]

export const demoConversations: Conversation[] = [
  {
    id: 'conv1', other_user: demoUsers[1],
    last_message: 'Bakı\'ya geldiğinde buluşalım!',
    last_message_at: '2024-06-24T14:30:00', unread_count: 2,
  },
  {
    id: 'conv2', other_user: demoUsers[2],
    last_message: 'Қазақстанға қош келдіңіз деп айтамын!',
    last_message_at: '2024-06-23T18:00:00', unread_count: 0,
  },
]

export const demoMessages: DirectMessage[] = [
  { id: 'dm1', from_user_id: 'u2', to_user_id: 'u1', text: 'Salam! TURAN\'ı necə bəyənirsən?', created_at: '2024-06-24T14:00:00', is_read: true },
  { id: 'dm2', from_user_id: 'u1', to_user_id: 'u2', text: 'Çok güzel bir platform! Kültürel paylaşımlar harika.', created_at: '2024-06-24T14:15:00', is_read: true },
  { id: 'dm3', from_user_id: 'u2', to_user_id: 'u1', text: 'Bakı\'ya geldiğinde buluşalım!', created_at: '2024-06-24T14:30:00', is_read: false },
  { id: 'dm4', from_user_id: 'u3', to_user_id: 'u1', text: 'Сәлем! Орхон жазбалары туралы жазбаңызды оқыдым.', created_at: '2024-06-23T17:30:00', is_read: true },
  { id: 'dm5', from_user_id: 'u1', to_user_id: 'u3', text: 'Teşekkürler! Çok ilgimi çekiyor bu konu.', created_at: '2024-06-23T17:45:00', is_read: true },
  { id: 'dm6', from_user_id: 'u3', to_user_id: 'u1', text: 'Қазақстанға қош келдіңіз деп айтамын!', created_at: '2024-06-23T18:00:00', is_read: true },
]

export const demoNotifications: AppNotification[] = [
  { id: 'n1', type: 'official', title: 'TURAN', body: 'Yeni resmi paylaşım: Göktürk Kağanlığı hakkında', is_read: false, from_user: officialUser, created_at: '2024-06-24T08:30:00' },
  { id: 'n2', type: 'like', title: 'Beğeni', body: 'Leyla Əliyeva paylaşımını beğendi', is_read: false, from_user: demoUsers[1], post_id: 'ep3', created_at: '2024-06-24T10:45:00' },
  { id: 'n3', type: 'comment', title: 'Yorum', body: 'Айбек Серікұлы paylaşımına yorum yaptı', is_read: true, from_user: demoUsers[2], post_id: 'ep3', created_at: '2024-06-24T11:30:00' },
  { id: 'n4', type: 'follow', title: 'Takip', body: 'Elif Demir seni takip etmeye başladı', is_read: true, from_user: demoUsers[4], created_at: '2024-06-23T16:00:00' },
  { id: 'n5', type: 'repost', title: 'Alıntı', body: 'Timur Karimov paylaşımını alıntıladı', is_read: true, from_user: demoUsers[5], post_id: 'ep3', created_at: '2024-06-23T14:30:00' },
  { id: 'n6', type: 'official', title: 'TURAN', body: 'Nevruz Bayramı hakkında yeni içerik', is_read: true, from_user: officialUser, created_at: '2024-06-23T09:00:00' },
]
