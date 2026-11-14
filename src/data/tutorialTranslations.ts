import { LanguageCode } from '../types/game';

export interface TutorialChapterContent {
  id: 'objective' | 'app_guide' | 'how_to_play';
  title: string;
  startSec: number;
  endSec: number;
  narration: string;
  caption: string;
}

export interface TutorialUiStrings {
  badge: string;
  heading: string;
  voiceLanguageLabel: string;
  voiceLabel: string;
  autoVoice: string;
  playVoiceBtn: string;
  replayVoiceBtn: string;
  mutedLabel: string;
  speakingLabel: string;
  scriptLabel: string;
  play: string;
  pause: string;
  restart: string;
  muteVoice: string;
  unmuteVoice: string;
  continueBtn: string;
  chapters: TutorialChapterContent[];
}

const EN_CHAPTERS: TutorialChapterContent[] = [
  {
    id: 'objective',
    title: '01. Main Objective',
    startSec: 0,
    endSec: 11,
    narration:
      'Welcome to SafeQuest: Lifeline Sector. Your main objective is to survive two full days across twenty-three natural disasters, protect your health and stamina, rescue stranded civilians, and board the Rescue Helicopter during its thirty-second landing window every two days.',
    caption:
      'Main Objective: Survive 2 full days, manage Health & Stamina, assist civilians, and board the Rescue Helicopter during its 30s window every 2 days.',
  },
  {
    id: 'app_guide',
    title: '02. How to Use the App',
    startSec: 11,
    endSec: 22,
    narration:
      'How to use the app. Start by choosing Adult or Child and customizing your outfit color. Pick Third-Person, First-Person, or P C Free Cam with V or C. Select P C, Mobile, or Controller, then press Enter Game to choose your disaster scenario, difficulty, and biome.',
    caption:
      'Using the App: Pick Adult or Child + outfit, set Camera View (3rd Person / 1st Person / Free Cam C) & Input Platform, then select a Disaster & Difficulty.',
  },
  {
    id: 'how_to_play',
    title: '03. How to Play & Survive',
    startSec: 22,
    endSec: 33,
    narration:
      'How to play. Follow the amber Resource Signal into rare Hospitals for Medkits and Supermarkets for Food. Shut shelter doors with F when hazards or wildfires close in. At night, dim street lights switch on—press L for your five-meter flashlight. Share Food or Medkits to rescue civilians, then sprint to the green helicopter.',
    caption:
      'How to Play: Scavenge Hospitals (Medkits) & Supermarkets (Food), seal doors (F) from closing wildfires, toggle Flashlight (L) at night, and share supplies to save civilians.',
  },
];

export const TUTORIAL_TRANSLATIONS: Record<LanguageCode, TutorialUiStrings> = {
  en: {
    badge: 'Start Briefing Video & Voice Over',
    heading: 'How to Play SafeQuest: Lifeline Sector',
    voiceLanguageLabel: 'Voice-Over Language',
    voiceLabel: 'Voice',
    autoVoice: 'Auto (Best Match)',
    playVoiceBtn: 'Play Voice Over',
    replayVoiceBtn: 'Replay Voice',
    mutedLabel: 'Voice Over Muted (Showing Captions)',
    speakingLabel: 'Voice Over Narrating',
    scriptLabel: 'Voice Over Script',
    play: 'Play',
    pause: 'Pause',
    restart: 'Restart',
    muteVoice: 'Mute Voice',
    unmuteVoice: 'Unmute Voice',
    continueBtn: 'Continue to Setup',
    chapters: EN_CHAPTERS,
  },
  hi: {
    badge: 'स्टार्ट ट्यूटोरियल वीडियो और वॉइस-ओवर',
    heading: 'सेफक्वेस्ट: लाइफलाइन सेक्टर कैसे खेलें',
    voiceLanguageLabel: 'वॉइस-ओवर भाषा',
    voiceLabel: 'आवाज़',
    autoVoice: 'ऑटो (सर्वश्रेष्ठ)',
    playVoiceBtn: 'वॉइस-ओवर चलाएं',
    replayVoiceBtn: 'आवाज़ दोबारा सुनें',
    mutedLabel: 'वॉइस-ओवर म्यूट है (कैप्शन दिख रहे हैं)',
    speakingLabel: 'वॉइस-ओवर चल रहा है',
    scriptLabel: 'वॉइस-ओवर स्क्रिप्ट',
    play: 'चलाएं',
    pause: 'रोकें',
    restart: 'फिर से शुरू करें',
    muteVoice: 'आवाज़ बंद करें',
    unmuteVoice: 'आवाज़ चालू करें',
    continueBtn: 'सेटअप पर जाएं',
    chapters: [
      {
        id: 'objective',
        title: '01. मुख्य उद्देश्य',
        startSec: 0,
        endSec: 11,
        narration:
          'सेफक्वेस्ट: लाइफलाइन सेक्टर में आपका स्वागत है। आपका मुख्य उद्देश्य तेईस प्राकृतिक आपदाओं में पूरे दो दिन जीवित रहना, अपना स्वास्थ्य और स्टैमिना बचाना, फंसे हुए नागरिकों की मदद करना, और हर दो दिन में तीस सेकंड के लिए आने वाले बचाव हेलीकॉप्टर में सवार होना है।',
        caption:
          'मुख्य उद्देश्य: 2 दिन जीवित रहें, स्वास्थ्य और स्टैमिना संभालें, नागरिकों को बचाएं और हर 2 दिन में 30 सेकंड के लिए आने वाले हेलीकॉप्टर में चढ़ें।',
      },
      {
        id: 'app_guide',
        title: '02. ऐप का उपयोग कैसे करें',
        startSec: 11,
        endSec: 22,
        narration:
          'ऐप का उपयोग कैसे करें। सबसे पहले एडल्ट या चाइल्ड चुनें और अपनी पोशाक का रंग बदलें। वी या सी दबाकर थर्ड-पर्सन, फर्स्ट-पर्सन या फ्री कैम चुनें। पीसी, मोबाइल या कंट्रोलर चुनें, फिर गेम में प्रवेश करें दबाकर आपदा और कठिनाई स्तर चुनें।',
        caption:
          'ऐप गाइड: एडल्ट या चाइल्ड + पोशाक चुनें, कैमरा व्यू (V/C) और कंट्रोल प्लेटफॉर्म सेट करें, फिर आपदा और कठिनाई चुनें।',
      },
      {
        id: 'how_to_play',
        title: '03. कैसे खेलें और बचें',
        startSec: 22,
        endSec: 33,
        narration:
          'कैसे खेलें। मेडिकल किट के लिए अस्पताल और भोजन के लिए सुपरमार्केट खोजने हेतु एम्बर रिसोर्स सिग्नल का पालन करें। जब खतरा या जंगल की आग पास आए तो एफ दबाकर दरवाजे बंद करें। रात में स्ट्रीट लाइट जलती हैं, टॉर्च के लिए एल दबाएं। नागरिकों को बचाने के लिए भोजन या मेडिकिट साझा करें।',
        caption:
          'कैसे खेलें: अस्पताल (मेडकिट) और सुपरमार्केट (भोजन) खोजें, एफ से दरवाजे बंद करें, रात में एल से टॉर्च जलाएं, और संसाधन साझा कर नागरिकों को बचाएं।',
      },
    ],
  },
  es: {
    badge: 'Video Tutorial y Narración de Voz',
    heading: 'Cómo Jugar SafeQuest: Sector Lifeline',
    voiceLanguageLabel: 'Idioma de la Voz',
    voiceLabel: 'Voz',
    autoVoice: 'Auto (Mejor)',
    playVoiceBtn: 'Reproducir Voz',
    replayVoiceBtn: 'Repetir Voz',
    mutedLabel: 'Voz Silenciada (Mostrando Subtítulos)',
    speakingLabel: 'Narrando en Voz Alta',
    scriptLabel: 'Guion de Narración',
    play: 'Reproducir',
    pause: 'Pausar',
    restart: 'Reiniciar',
    muteVoice: 'Silenciar Voz',
    unmuteVoice: 'Activar Voz',
    continueBtn: 'Ir a Configuración',
    chapters: [
      {
        id: 'objective',
        title: '01. Objetivo Principal',
        startSec: 0,
        endSec: 11,
        narration:
          'Bienvenido a SafeQuest: Sector Lifeline. Tu objetivo principal es sobrevivir dos días completos ante veintitrés desastres naturales, proteger tu salud y resistencia, rescatar civiles atrapados y abordar el helicóptero de rescate durante su ventana de treinta segundos cada dos días.',
        caption:
          'Objetivo: Sobrevive 2 días, cuida Salud y Resistencia, ayuda a civiles y aborda el Helicóptero de Rescate en su ventana de 30s cada 2 días.',
      },
      {
        id: 'app_guide',
        title: '02. Cómo Usar la App',
        startSec: 11,
        endSec: 22,
        narration:
          'Cómo usar la aplicación. Elige entre Adulto o Niño y personaliza el color de tu uniforme. Selecciona tercera persona, primera persona o cámara libre con V o C. Elige controles de PC, móvil o mando y entra al juego para seleccionar el desastre y la dificultad.',
        caption:
          'Uso de la App: Elige Adulto o Niño + color, ajusta la cámara (3.ª / 1.ª Persona / Cámara Libre C) y plataforma, y selecciona desastre y dificultad.',
      },
      {
        id: 'how_to_play',
        title: '03. Cómo Jugar y Sobrevivir',
        startSec: 22,
        endSec: 33,
        narration:
          'Cómo jugar. Sigue la señal ámbar hacia hospitales para conseguir botiquines y supermercados para comida. Cierra las puertas de refugios con F cuando el incendio forestal se acerque. De noche se encienden farolas tenues; pulsa L para la linterna y comparte comida o botiquines para rescatar civiles.',
        caption:
          'Cómo Jugar: Busca Hospitales (Botiquines) y Supermercados (Comida), cierra puertas (F) ante incendios, usa Linterna (L) de noche y comparte suministros al rescatar.',
      },
    ],
  },
  fr: {
    badge: 'Vidéo Tutoriel et Voix Off',
    heading: 'Comment Jouer à SafeQuest : Secteur Lifeline',
    voiceLanguageLabel: 'Langue de la Voix Off',
    voiceLabel: 'Voix',
    autoVoice: 'Auto (Meilleure)',
    playVoiceBtn: 'Lire la Voix Off',
    replayVoiceBtn: 'Réécouter',
    mutedLabel: 'Voix Off Coupée (Sous-titres Actifs)',
    speakingLabel: 'Narration en Cours',
    scriptLabel: 'Texte de la Voix Off',
    play: 'Lire',
    pause: 'Pause',
    restart: 'Recommencer',
    muteVoice: 'Couper Voix',
    unmuteVoice: 'Activer Voix',
    continueBtn: 'Continuer',
    chapters: [
      {
        id: 'objective',
        title: '01. Objectif Principal',
        startSec: 0,
        endSec: 11,
        narration:
          'Bienvenue dans SafeQuest : Secteur Lifeline. Votre objectif principal est de survivre deux jours complets face à vingt-trois catastrophes naturelles, de préserver votre santé et votre endurance, de secourir des civils et de monter dans l’hélicoptère pendant son créneau de trente secondes tous les deux jours.',
        caption:
          'Objectif : Survivez 2 jours complets, gérez Santé et Endurance, secourez les civils et embarquez dans l’hélicoptère (fenêtre de 30s tous les 2 jours).',
      },
      {
        id: 'app_guide',
        title: '02. Utiliser l’Application',
        startSec: 11,
        endSec: 22,
        narration:
          'Comment utiliser l’application. Choisissez Adulte ou Enfant et personnalisez votre tenue. Sélectionnez la troisième personne, la première personne ou la caméra libre avec V ou C. Choisissez PC, Mobile ou Manette, puis lancez le jeu pour choisir le scénario et la difficulté.',
        caption:
          'Utilisation : Choisissez Adulte ou Enfant + tenue, réglez la caméra (V / C) et les contrôles, puis sélectionnez la catastrophe et la difficulté.',
      },
      {
        id: 'how_to_play',
        title: '03. Jouer et Survivre',
        startSec: 22,
        endSec: 33,
        narration:
          'Comment jouer. Suivez le signal ambre vers les hôpitaux pour les trousses de secours et les supermarchés pour la nourriture. Fermez les portes avec F lorsque les incendies approchent. La nuit, les lampadaires s’allument ; appuyez sur L pour la lampe torche et partagez des vivres pour sauver les civils.',
        caption:
          'Survie : Fouillez Hôpitaux (Soins) et Supermarchés (Nourriture), fermez les portes (F) face aux feux, activez la Lampe (L) la nuit et partagez vos ressources.',
      },
    ],
  },
  ar: {
    badge: 'فيديو تعليمي والتعليق الصوتي',
    heading: 'كيفية لعب SafeQuest: قطاع النجاة',
    voiceLanguageLabel: 'لغة التعليق الصوتي',
    voiceLabel: 'الصوت',
    autoVoice: 'تلقائي (الأفضل)',
    playVoiceBtn: 'تشغيل الصوت',
    replayVoiceBtn: 'إعادة الصوت',
    mutedLabel: 'الصوت مكتوم (تظهر الترجمة)',
    speakingLabel: 'جاري تشغيل التعليق الصوتي',
    scriptLabel: 'نص التعليق الصوتي',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    restart: 'إعادة البدء',
    muteVoice: 'كتم الصوت',
    unmuteVoice: 'تشغيل الصوت',
    continueBtn: 'المتابعة للإعداد',
    chapters: [
      {
        id: 'objective',
        title: '01. الهدف الرئيسي',
        startSec: 0,
        endSec: 11,
        narration:
          'مرحباً بك في SafeQuest: قطاع النجاة. هدفك الرئيسي هو البقاء على قيد الحياة ليومين كاملين وسط ثلاث وعشرين كارثة طبيعية، والحفاظ على صحتك وقدرتك على التحمل، وإنقاذ المدنيين، والصعود إلى مروحية الإنقاذ خلال ثلاثين ثانية كل يومين.',
        caption:
          'الهدف الرئيسي: انجُ ليومين كاملين، حافظ على الصحة والطاقة، أنقذ المدنيين، واركب مروحية الإنقاذ خلال نافذة 30 ثانية كل يومين.',
      },
      {
        id: 'app_guide',
        title: '02. كيفية استخدام التطبيق',
        startSec: 11,
        endSec: 22,
        narration:
          'كيفية استخدام التطبيق. ابدأ باختيار شخصية بالغ أو طفل وتخصيص لون الملابس. اختر منظور الشخص الثالث أو الأول أو الكاميرا الحرة عبر V أو C. حدد التحكم للكمبيوتر أو الجوال أو وحدة التحكم ثم ادخل لاختيار الكارثة ومستوى الصعوبة.',
        caption:
          'استخدام التطبيق: اختر بالغ أو طفل واللون، حدد الكاميرا (V أو C) ومنصة التحكم، ثم انتقل لاختيار الكارثة والصعوبة.',
      },
      {
        id: 'how_to_play',
        title: '03. كيفية اللعب والنجاة',
        startSec: 22,
        endSec: 33,
        narration:
          'كيفية اللعب. اتبع إشارة الموارد للعثور على المستشفيات للإسعافات الأولية والمتاجر للطعام. أغلق أبواب الملاجئ بالمفتاح F عند اقتراب الحرائق. في الليل تضيء أعمدة الشوارع واضغط L لتشغيل المصباح، وشارك الطعام أو الإسعافات لإنقاذ المدنيين.',
        caption:
          'طريقة اللعب: اجمع الإسعافات من المستشفيات والطعام من المتاجر، أغلق الأبواب (F) عند اقتراب الحريق، شغّل المصباح (L) ليلاً، وشارك الموارد للإنقاذ.',
      },
    ],
  },
  zh: {
    badge: '开场教学视频与语音讲解',
    heading: '如何游玩 SafeQuest：生命线扇区',
    voiceLanguageLabel: '语音讲解语言',
    voiceLabel: '语音',
    autoVoice: '自动（最佳匹配）',
    playVoiceBtn: '播放语音讲解',
    replayVoiceBtn: '重播语音',
    mutedLabel: '语音已静音（显示字幕）',
    speakingLabel: '语音正在播放',
    scriptLabel: '语音字幕',
    play: '播放',
    pause: '暂停',
    restart: '重新开始',
    muteVoice: '静音',
    unmuteVoice: '开启语音',
    continueBtn: '进入设置',
    chapters: [
      {
        id: 'objective',
        title: '01. 主要目标',
        startSec: 0,
        endSec: 11,
        narration:
          '欢迎来到 SafeQuest：生命线扇区。你的主要目标是在二十三种自然灾害中存活整整两天，保护生命值和体力，救援受困平民，并在每隔两天出现一次、仅停留三十秒的救援直升机窗口期登机撤离。',
        caption:
          '主要目标：存活2天，维持生命与体力，救援平民，并在每2天出现30秒的救援直升机窗口登机撤离。',
      },
      {
        id: 'app_guide',
        title: '02. 如何使用本应用',
        startSec: 11,
        endSec: 22,
        narration:
          '如何使用本应用。首先选择成人或儿童角色并自定义服装颜色。按 V 或 C 切换第三人称、第一人称或电脑自由视角。选择电脑、手机或手柄控制模式，然后点击进入游戏选择灾害场景与难度。',
        caption:
          '应用指南：选择成人或儿童与服装颜色，切换视角（V / C）与操作设备，再选择灾害场景与难度。',
      },
      {
        id: 'how_to_play',
        title: '03. 玩法与生存技巧',
        startSec: 22,
        endSec: 33,
        narration:
          '玩法说明。跟随琥珀色资源信号前往稀有的医院获取急救包、前往超市获取食物。当灾害或野火逼近时按 F 关门躲避。夜晚路灯会自动亮起，按 L 开启五米手电筒。救援平民时会分享食物或急救包，之后冲向绿色直升机。',
        caption:
          '玩法技巧：在医院拿急救包、超市拿食物，野火逼近时按 F 关门，夜晚按 L 开手电，分享物资救援平民并登机。',
      },
    ],
  },
  ja: {
    badge: 'スタート解説動画＆ボイスオーバー',
    heading: 'SafeQuest: ライフライン・セクターの遊び方',
    voiceLanguageLabel: '音声ガイドの言語',
    voiceLabel: '音声',
    autoVoice: '自動（最適）',
    playVoiceBtn: '音声を再生',
    replayVoiceBtn: '音声をもう一度',
    mutedLabel: '音声ミュート中（字幕表示）',
    speakingLabel: '音声ガイド再生中',
    scriptLabel: '音声スクリプト',
    play: '再生',
    pause: '一時停止',
    restart: '最初から',
    muteVoice: '音声ミュート',
    unmuteVoice: '音声オン',
    continueBtn: '設定へ進む',
    chapters: [
      {
        id: 'objective',
        title: '01. 主な目的',
        startSec: 0,
        endSec: 11,
        narration:
          'SafeQuest ライフライン・セクターへようこそ。主な目的は、二十三種類の自然災害の中で二日間生き延び、体力とスタミナを守り、取り残された市民を救助して、二日ごとに三十秒間だけ到着する救助ヘリに乗り込むことです。',
        caption:
          '主な目的：2日間生き延び、体力とスタミナを保ち、市民を救助して2日ごとに30秒間到着する救助ヘリへ搭乗する。',
      },
      {
        id: 'app_guide',
        title: '02. アプリの使い方',
        startSec: 11,
        endSec: 22,
        narration:
          'アプリの使い方です。まず大人または子どもを選び、服の色をカスタマイズします。VまたはCキーで三人称、一人称、フリーカメラを切り替えられます。PC、モバイル、コントローラーから操作を選び、災害と難易度を決めて開始しましょう。',
        caption:
          'アプリの使い方：大人／子どもと服装を選び、視点（V/C）と操作方法を設定して、災害シナリオと難易度を選択します。',
      },
      {
        id: 'how_to_play',
        title: '03. 遊び方とサバイバル',
        startSec: 22,
        endSec: 33,
        narration:
          '遊び方です。アンバー色の資源シグナルを頼りに、病院で救急キット、スーパーで食料を集めましょう。山火事が迫ったらFキーで避難所のドアを閉めます。夜間は街灯が点き、Lキーで五メートルの懐中電灯が使えます。救助には食料や救急キットを分け与えます。',
        caption:
          '遊び方：病院（救急キット）とスーパー（食料）を探索し、山火事が迫れば F で施錠、夜は L で懐中電灯を使い、物資を分けて市民を救助。',
      },
    ],
  },
  pt: {
    badge: 'Vídeo Tutorial e Narração por Voz',
    heading: 'Como Jogar SafeQuest: Setor Lifeline',
    voiceLanguageLabel: 'Idioma da Narração',
    voiceLabel: 'Voz',
    autoVoice: 'Auto (Melhor)',
    playVoiceBtn: 'Reproduzir Voz',
    replayVoiceBtn: 'Repetir Voz',
    mutedLabel: 'Voz Silenciada (Exibindo Legendas)',
    speakingLabel: 'Narração em Andamento',
    scriptLabel: 'Roteiro da Narração',
    play: 'Reproduzir',
    pause: 'Pausar',
    restart: 'Reiniciar',
    muteVoice: 'Silenciar Voz',
    unmuteVoice: 'Ativar Voz',
    continueBtn: 'Ir para Configuração',
    chapters: [
      {
        id: 'objective',
        title: '01. Objetivo Principal',
        startSec: 0,
        endSec: 11,
        narration:
          'Bem-vindo ao SafeQuest: Setor Lifeline. Seu objetivo principal é sobreviver dois dias completos em vinte e três desastres naturais, proteger sua saúde e energia, resgatar civis e embarcar no helicóptero de resgate durante sua janela de trinta segundos a cada dois dias.',
        caption:
          'Objetivo: Sobreviva 2 dias, proteja Saúde e Energia, ajude civis e embarque no Helicóptero na janela de 30s a cada 2 dias.',
      },
      {
        id: 'app_guide',
        title: '02. Como Usar o App',
        startSec: 11,
        endSec: 22,
        narration:
          'Como usar o aplicativo. Escolha entre Adulto ou Criança e personalize a cor do uniforme. Selecione terceira pessoa, primeira pessoa ou câmera livre com V ou C. Escolha PC, Celular ou Controle, entre no jogo e selecione o desastre e a dificuldade.',
        caption:
          'Uso do App: Escolha Adulto ou Criança + uniforme, ajuste Câmera (V / C) e Controles, e selecione o Desastre e Dificuldade.',
      },
      {
        id: 'how_to_play',
        title: '03. Como Jogar e Sobreviver',
        startSec: 22,
        endSec: 33,
        narration:
          'Como jogar. Siga o sinal âmbar até hospitais raros para pegar kits médicos e supermercados para comida. Feche portas com F quando incêndios se aproximarem. À noite, postes acendem; aperte L para ligar a lanterna e compartilhe suprimentos para salvar civis.',
        caption:
          'Sobrevivência: Explore Hospitais (Kits) e Supermercados (Comida), feche portas (F) contra incêndios, use Lanterna (L) à noite e compartilhe recursos.',
      },
    ],
  },
  de: {
    badge: 'Start-Tutorialvideo & Sprachausgabe',
    heading: 'So Spielst du SafeQuest: Lifeline Sektor',
    voiceLanguageLabel: 'Sprache der Sprachausgabe',
    voiceLabel: 'Stimme',
    autoVoice: 'Auto (Beste)',
    playVoiceBtn: 'Sprache Abspielen',
    replayVoiceBtn: 'Erneut Hören',
    mutedLabel: 'Sprache Stumm (Untertitel Aktiv)',
    speakingLabel: 'Sprachausgabe Läuft',
    scriptLabel: 'Sprechertext',
    play: 'Abspielen',
    pause: 'Pause',
    restart: 'Neu Starten',
    muteVoice: 'Ton Aus',
    unmuteVoice: 'Ton An',
    continueBtn: 'Weiter zum Setup',
    chapters: [
      {
        id: 'objective',
        title: '01. Hauptziel',
        startSec: 0,
        endSec: 11,
        narration:
          'Willkommen bei SafeQuest: Lifeline Sektor. Dein Hauptziel ist es, zwei volle Tage in dreiundzwanzig Naturkatastrophen zu überleben, Gesundheit und Ausdauer zu schützen, Zivilisten zu retten und alle zwei Tage im dreißig Sekunden Fenster den Rettungshubschrauber zu erreichen.',
        caption:
          'Hauptziel: 2 volle Tage überleben, Gesundheit & Ausdauer schützen, Zivilisten retten und alle 2 Tage im 30s-Fenster den Hubschrauber erreichen.',
      },
      {
        id: 'app_guide',
        title: '02. Bedienung der App',
        startSec: 11,
        endSec: 22,
        narration:
          'Bedienung der App. Wähle zuerst Erwachsener oder Kind und passe deine Outfitfarbe an. Wechsle mit V oder C zwischen Verfolgerkamera, Egoperspektive und freier Kamera. Wähle PC, Mobil oder Controller und starte dann Szenario und Schwierigkeit.',
        caption:
          'App-Bedienung: Erwachsener oder Kind + Farbe wählen, Kamera (V / C) & Eingabe festlegen und Katastrophe samt Schwierigkeit auswählen.',
      },
      {
        id: 'how_to_play',
        title: '03. Spielregeln & Überleben',
        startSec: 22,
        endSec: 33,
        narration:
          'So wird gespielt. Folge dem gelben Signal zu seltenen Krankenhäusern für Medkits und Supermärkten für Nahrung. Schließe Türen mit F, wenn Waldbrände näher rücken. Nachts leuchten Straßenlaternen; drücke L für die Taschenlampe und teile Vorräte zur Rettung.',
        caption:
          'Überleben: Krankenhäuser (Medkits) & Supermärkte (Nahrung) finden, Türen schließen (F) bei Waldbrand, Taschenlampe (L) nachts nutzen, Vorräte teilen.',
      },
    ],
  },
  ko: {
    badge: '시작 튜토리얼 영상 및 음성 안내',
    heading: 'SafeQuest: 라이프라인 섹터 플레이 방법',
    voiceLanguageLabel: '음성 안내 언어',
    voiceLabel: '목소리',
    autoVoice: '자동 (최적)',
    playVoiceBtn: '음성 재생',
    replayVoiceBtn: '다시 듣기',
    mutedLabel: '음성 음소거됨 (자막 표시 중)',
    speakingLabel: '음성 안내 재생 중',
    scriptLabel: '음성 대본',
    play: '재생',
    pause: '일시정지',
    restart: '다시 시작',
    muteVoice: '음성 끄기',
    unmuteVoice: '음성 켜기',
    continueBtn: '설정으로 계속',
    chapters: [
      {
        id: 'objective',
        title: '01. 주요 목표',
        startSec: 0,
        endSec: 11,
        narration:
          'SafeQuest: 라이프라인 섹터에 오신 것을 환영합니다. 주요 목표는 스물세 가지 자연재해 속에서 이틀 동안 생존하고, 체력과 스태미나를 지키며, 고립된 시민을 구조한 뒤 이틀마다 삼십 초간 착륙하는 구조 헬기에 탑승하는 것입니다.',
        caption:
          '주요 목표: 2일 동안 생존하고 체력·스태미나를 관리하며 시민을 구조하고, 2일마다 30초간 머무는 구조 헬기에 탑승하세요.',
      },
      {
        id: 'app_guide',
        title: '02. 앱 사용 방법',
        startSec: 11,
        endSec: 22,
        narration:
          '앱 사용 방법입니다. 먼저 성인 또는 어린이 캐릭터를 고르고 복장 색상을 선택하세요. V 또는 C 키로 삼인칭, 일인칭, PC 자유 시점을 전환할 수 있습니다. PC, 모바일, 컨트롤러 조작을 설정한 뒤 재난과 난이도를 선택하세요.',
        caption:
          '앱 사용법: 성인·어린이 캐릭터와 복장 선택, 시점(V/C) 및 조작 기기 설정 후 재난 시나리오와 난이도를 고릅니다.',
      },
      {
        id: 'how_to_play',
        title: '03. 플레이 및 생존 요령',
        startSec: 22,
        endSec: 33,
        narration:
          '플레이 방법입니다. 호박색 자원 신호를 따라 병원에서 구급상자를, 마트에서 식량을 확보하세요. 산불이 좁혀오면 F 키로 대피소 문을 닫으세요. 밤에는 가로등이 켜지며 L 키로 손전등을 켤 수 있습니다. 시민 구조 시 식량이나 구급상자를 나누어 줍니다.',
        caption:
          '생존 요령: 병원(구급상자)·마트(식량) 탐색, 산불 접근 시 F로 문 닫기, 밤에 L로 손전등 켜기, 물자를 나누어 시민 구조.',
      },
    ],
  },
};

export function getTutorialStrings(lang: LanguageCode): TutorialUiStrings {
  return TUTORIAL_TRANSLATIONS[lang] ?? TUTORIAL_TRANSLATIONS.en;
}
