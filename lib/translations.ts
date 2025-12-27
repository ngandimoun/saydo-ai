export type Language = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja' | 'pt' | 'it' | 'ru' | 'ko' | 'hi' | 'tr' | 'nl' | 'pl' | 'sv' | 'no' | 'da' | 'fi' | 'el' | 'he' | 'th' | 'vi' | 'id' | 'cs' | 'ro' | 'hu' | 'uk' | 'bg' | 'sw' | 'yo' | 'ig' | 'ha' | 'rw' | 'zu' | 'am' | 'tl' | 'ms' | 'bn' | 'ta' | 'te' | 'ur' | 'pa' | 'et' | 'lv' | 'lt' | 'sk' | 'sl' | 'hr' | 'sr'

export interface Translations {
  onboarding: {
    welcome: string
    subtitle: string
    step: string
    of: string
    next: string
    back: string
    continue: string
    skip: string
    finish: string
  }
  steps: {
    language: {
      title: string
      question: string
    }
    name: {
      title: string
      question: string
      placeholder: string
    }
    profession: {
      title: string
      question: string
      manualEntry: string
      criticalArtifacts: string
      addCustom: string
      customProfession: string
      customProfessionDesc: string
      customArtifact: string
      customArtifactDesc: string
    }
    informationDiet: {
      title: string
      socialIntelligence: {
        question: string
      }
      newsFocus: {
        question: string
      }
      privacyBadge: string
    }
    essentials: {
      title: string
      gender: {
        question: string
        male: string
        female: string
        nonBinary: string
        preferNotToSay: string
      }
      age: {
        question: string
        placeholder: string
      }
      bloodGroup: {
        question: string
      }
      bodyType: {
        question: string
        weight: string
      }
      allergies: {
        question: string
        addCustom: string
      }
      skinTone: {
        question: string
      }
    }
    health: {
      title: string
      question: string
    }
  }
  professions: Record<string, string>
  languages: Record<string, string>
}

// Core translations with full translations (first 7 languages)
const coreTranslations: Record<'en' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja', Translations> = {
  en: {
    onboarding: {
      welcome: 'Welcome to Saydo',
      subtitle: "Let's get you set up",
      step: 'Step',
      of: 'of',
      next: 'Next',
      back: 'Back',
      continue: 'Continue',
      skip: 'Skip',
      finish: 'Finish'
    },
    steps: {
      language: {
        title: 'Language Selection',
        question: 'What language do we speak in?'
      },
      name: {
        title: 'Preferred Name',
        question: 'What should I call you?',
        placeholder: 'Enter your preferred name'
      },
      profession: {
        title: 'Professional DNA',
        question: 'What is your profession?',
        manualEntry: 'Manual Entry',
        criticalArtifacts: 'As a {profession}, what are your "Critical Artifacts"?',
        addCustom: 'Add Custom',
        customProfession: 'Custom Profession',
        customProfessionDesc: 'Enter your profession name',
        customArtifact: 'Custom Artifact',
        customArtifactDesc: 'Enter artifact name'
      },
      informationDiet: {
        title: 'Information Diet',
        socialIntelligence: {
          question: 'Where do you get your best ideas?'
        },
        newsFocus: {
          question: 'What verticals should I monitor for you?'
        },
        privacyBadge: 'Privacy First'
      },
      essentials: {
        title: 'The Essentials',
        gender: {
          question: 'Gender',
          male: 'Male',
          female: 'Female',
          nonBinary: 'Non-binary',
          preferNotToSay: 'Prefer not to say'
        },
        age: {
          question: 'Age',
          placeholder: 'Enter your age'
        },
        bloodGroup: {
          question: 'Blood Group'
        },
        bodyType: {
          question: 'Body Type',
          weight: 'Weight (kg)'
        },
        allergies: {
          question: 'Allergies',
          addCustom: 'Add Custom Allergy'
        },
        skinTone: {
          question: 'Skin Tone/Color'
        }
      },
      health: {
        title: 'Health Engine',
        question: 'How are we optimizing your body?'
      }
    },
    professions: {
      doctor: 'Doctor',
      nurse: 'Nurse',
      pharmacist: 'Pharmacist',
      founder: 'Founder',
      entrepreneur: 'Entrepreneur',
      retiring: 'Retiring',
      jobless: 'Jobless',
      finance: 'Finance',
      marketing: 'Marketing',
      whiteCollar: 'White Collar',
      blueCollar: 'Blue Collar',
      mechanic: 'Mechanic'
    },
    languages: {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ar: 'Arabic',
      zh: 'Chinese',
      ja: 'Japanese'
    }
  },
  es: {
    onboarding: {
      welcome: 'Bienvenido a Saydo',
      subtitle: 'Vamos a configurarte',
      step: 'Paso',
      of: 'de',
      next: 'Siguiente',
      back: 'Atrás',
      continue: 'Continuar',
      skip: 'Omitir',
      finish: 'Finalizar'
    },
    steps: {
      language: {
        title: 'Selección de Idioma',
        question: '¿En qué idioma hablamos?'
      },
      name: {
        title: 'Nombre Preferido',
        question: '¿Cómo debo llamarte?',
        placeholder: 'Ingresa tu nombre preferido'
      },
      profession: {
        title: 'ADN Profesional',
        question: '¿Cuál es tu profesión?',
        manualEntry: 'Entrada Manual',
        criticalArtifacts: 'Como {profession}, ¿cuáles son tus "Artefactos Críticos"?',
        addCustom: 'Agregar Personalizado',
        customProfession: 'Profesión Personalizada',
        customProfessionDesc: 'Ingresa el nombre de tu profesión',
        customArtifact: 'Artefacto Personalizado',
        customArtifactDesc: 'Ingresa el nombre del artefacto'
      },
      informationDiet: {
        title: 'Dieta de Información',
        socialIntelligence: {
          question: '¿Dónde obtienes tus mejores ideas?'
        },
        newsFocus: {
          question: '¿Qué verticales debo monitorear para ti?'
        },
        privacyBadge: 'Privacidad Primero'
      },
      essentials: {
        title: 'Lo Esencial',
        gender: {
          question: 'Género',
          male: 'Masculino',
          female: 'Femenino',
          nonBinary: 'No binario',
          preferNotToSay: 'Prefiero no decir'
        },
        age: {
          question: 'Edad',
          placeholder: 'Ingresa tu edad'
        },
        bloodGroup: {
          question: 'Grupo Sanguíneo'
        },
        bodyType: {
          question: 'Tipo de Cuerpo',
          weight: 'Peso (kg)'
        },
        allergies: {
          question: 'Alergias',
          addCustom: 'Agregar Alergia Personalizada'
        },
        skinTone: {
          question: 'Tono de Piel/Color'
        }
      },
      health: {
        title: 'Motor de Salud',
        question: '¿Cómo estamos optimizando tu cuerpo?'
      }
    },
    professions: {
      doctor: 'Doctor',
      nurse: 'Enfermera',
      pharmacist: 'Farmacéutico',
      founder: 'Fundador',
      entrepreneur: 'Empresario',
      retiring: 'Jubilado',
      jobless: 'Desempleado',
      finance: 'Finanzas',
      marketing: 'Marketing',
      whiteCollar: 'Trabajo de Oficina',
      blueCollar: 'Trabajo Manual',
      mechanic: 'Mecánico'
    },
    languages: {
      en: 'Inglés',
      es: 'Español',
      fr: 'Francés',
      de: 'Alemán',
      ar: 'Árabe',
      zh: 'Chino',
      ja: 'Japonés'
    }
  },
  fr: {
    onboarding: {
      welcome: 'Bienvenue sur Saydo',
      subtitle: 'Configurons votre profil',
      step: 'Étape',
      of: 'de',
      next: 'Suivant',
      back: 'Retour',
      continue: 'Continuer',
      skip: 'Passer',
      finish: 'Terminer'
    },
    steps: {
      language: {
        title: 'Sélection de la Langue',
        question: 'Dans quelle langue parlons-nous?'
      },
      name: {
        title: 'Nom Préféré',
        question: 'Comment dois-je vous appeler?',
        placeholder: 'Entrez votre nom préféré'
      },
      profession: {
        title: 'ADN Professionnel',
        question: 'Quelle est votre profession?',
        manualEntry: 'Saisie Manuelle',
        criticalArtifacts: 'En tant que {profession}, quels sont vos "Artefacts Critiques"?',
        addCustom: 'Ajouter Personnalisé',
        customProfession: 'Profession Personnalisée',
        customProfessionDesc: 'Entrez le nom de votre profession',
        customArtifact: 'Artefact Personnalisé',
        customArtifactDesc: 'Entrez le nom de l\'artefact'
      },
      informationDiet: {
        title: 'Régime d\'Information',
        socialIntelligence: {
          question: 'Où obtenez-vous vos meilleures idées?'
        },
        newsFocus: {
          question: 'Quels secteurs dois-je surveiller pour vous?'
        },
        privacyBadge: 'Confidentialité d\'Abord'
      },
      essentials: {
        title: 'L\'Essentiel',
        gender: {
          question: 'Genre',
          male: 'Homme',
          female: 'Femme',
          nonBinary: 'Non-binaire',
          preferNotToSay: 'Préfère ne pas dire'
        },
        age: {
          question: 'Âge',
          placeholder: 'Entrez votre âge'
        },
        bloodGroup: {
          question: 'Groupe Sanguin'
        },
        bodyType: {
          question: 'Type de Corps',
          weight: 'Poids (kg)'
        },
        allergies: {
          question: 'Allergies',
          addCustom: 'Ajouter une Allergie Personnalisée'
        },
        skinTone: {
          question: 'Teint/Couleur de Peau'
        }
      },
      health: {
        title: 'Moteur de Santé',
        question: 'Comment optimisons-nous votre corps?'
      }
    },
    professions: {
      doctor: 'Médecin',
      nurse: 'Infirmière',
      pharmacist: 'Pharmacien',
      founder: 'Fondateur',
      entrepreneur: 'Entrepreneur',
      retiring: 'Retraité',
      jobless: 'Sans Emploi',
      finance: 'Finance',
      marketing: 'Marketing',
      whiteCollar: 'Col Blanc',
      blueCollar: 'Col Bleu',
      mechanic: 'Mécanicien'
    },
    languages: {
      en: 'Anglais',
      es: 'Espagnol',
      fr: 'Français',
      de: 'Allemand',
      ar: 'Arabe',
      zh: 'Chinois',
      ja: 'Japonais'
    }
  },
  de: {
    onboarding: {
      welcome: 'Willkommen bei Saydo',
      subtitle: 'Lass uns dich einrichten',
      step: 'Schritt',
      of: 'von',
      next: 'Weiter',
      back: 'Zurück',
      continue: 'Fortfahren',
      skip: 'Überspringen',
      finish: 'Abschließen'
    },
    steps: {
      language: {
        title: 'Sprachauswahl',
        question: 'In welcher Sprache sprechen wir?'
      },
      name: {
        title: 'Bevorzugter Name',
        question: 'Wie soll ich dich nennen?',
        placeholder: 'Gib deinen bevorzugten Namen ein'
      },
      profession: {
        title: 'Professionelle DNA',
        question: 'Was ist dein Beruf?',
        manualEntry: 'Manuelle Eingabe',
        criticalArtifacts: 'Als {profession}, was sind deine "Kritischen Artefakte"?',
        addCustom: 'Benutzerdefiniert Hinzufügen',
        customProfession: 'Benutzerdefinierter Beruf',
        customProfessionDesc: 'Gib deinen Berufsnamen ein',
        customArtifact: 'Benutzerdefiniertes Artefakt',
        customArtifactDesc: 'Gib den Artefaktnamen ein'
      },
      informationDiet: {
        title: 'Informationsdiät',
        socialIntelligence: {
          question: 'Woher bekommst du deine besten Ideen?'
        },
        newsFocus: {
          question: 'Welche Bereiche soll ich für dich überwachen?'
        },
        privacyBadge: 'Datenschutz Zuerst'
      },
      essentials: {
        title: 'Das Wesentliche',
        gender: {
          question: 'Geschlecht',
          male: 'Männlich',
          female: 'Weiblich',
          nonBinary: 'Nicht-binär',
          preferNotToSay: 'Möchte nicht sagen'
        },
        age: {
          question: 'Alter',
          placeholder: 'Gib dein Alter ein'
        },
        bloodGroup: {
          question: 'Blutgruppe'
        },
        bodyType: {
          question: 'Körpertyp',
          weight: 'Gewicht (kg)'
        },
        allergies: {
          question: 'Allergien',
          addCustom: 'Benutzerdefinierte Allergie Hinzufügen'
        },
        skinTone: {
          question: 'Hautton/Farbe'
        }
      },
      health: {
        title: 'Gesundheitsmotor',
        question: 'Wie optimieren wir deinen Körper?'
      }
    },
    professions: {
      doctor: 'Arzt',
      nurse: 'Krankenschwester',
      pharmacist: 'Apotheker',
      founder: 'Gründer',
      entrepreneur: 'Unternehmer',
      retiring: 'Im Ruhestand',
      jobless: 'Arbeitslos',
      finance: 'Finanzen',
      marketing: 'Marketing',
      whiteCollar: 'Angestellter',
      blueCollar: 'Arbeiter',
      mechanic: 'Mechaniker'
    },
    languages: {
      en: 'Englisch',
      es: 'Spanisch',
      fr: 'Französisch',
      de: 'Deutsch',
      ar: 'Arabisch',
      zh: 'Chinesisch',
      ja: 'Japanisch'
    }
  },
  ar: {
    onboarding: {
      welcome: 'مرحباً بك في Saydo',
      subtitle: 'دعنا نعدك',
      step: 'خطوة',
      of: 'من',
      next: 'التالي',
      back: 'رجوع',
      continue: 'متابعة',
      skip: 'تخطي',
      finish: 'إنهاء'
    },
    steps: {
      language: {
        title: 'اختيار اللغة',
        question: 'ما اللغة التي نتحدث بها؟'
      },
      name: {
        title: 'الاسم المفضل',
        question: 'ماذا يجب أن أناديك؟',
        placeholder: 'أدخل اسمك المفضل'
      },
      profession: {
        title: 'الحمض النووي المهني',
        question: 'ما هي مهنتك؟',
        manualEntry: 'إدخال يدوي',
        criticalArtifacts: 'كـ {profession}، ما هي "القطع الحرجة" الخاصة بك؟',
        addCustom: 'إضافة مخصص',
        customProfession: 'مهنة مخصصة',
        customProfessionDesc: 'أدخل اسم مهنتك',
        customArtifact: 'قطعة مخصصة',
        customArtifactDesc: 'أدخل اسم القطعة'
      },
      informationDiet: {
        title: 'نظام المعلومات',
        socialIntelligence: {
          question: 'من أين تحصل على أفضل أفكارك؟'
        },
        newsFocus: {
          question: 'ما القطاعات التي يجب أن أراقبها لك؟'
        },
        privacyBadge: 'الخصوصية أولاً'
      },
      essentials: {
        title: 'الأساسيات',
        gender: {
          question: 'الجنس',
          male: 'ذكر',
          female: 'أنثى',
          nonBinary: 'غير ثنائي',
          preferNotToSay: 'أفضل عدم القول'
        },
        age: {
          question: 'العمر',
          placeholder: 'أدخل عمرك'
        },
        bloodGroup: {
          question: 'فصيلة الدم'
        },
        bodyType: {
          question: 'نوع الجسم',
          weight: 'الوزن (كجم)'
        },
        allergies: {
          question: 'الحساسية',
          addCustom: 'إضافة حساسية مخصصة'
        },
        skinTone: {
          question: 'لون البشرة'
        }
      },
      health: {
        title: 'محرك الصحة',
        question: 'كيف نُحسّن جسمك؟'
      }
    },
    professions: {
      doctor: 'طبيب',
      nurse: 'ممرضة',
      pharmacist: 'صيدلي',
      founder: 'مؤسس',
      entrepreneur: 'رائد أعمال',
      retiring: 'متقاعد',
      jobless: 'عاطل عن العمل',
      finance: 'مالية',
      marketing: 'تسويق',
      whiteCollar: 'وظيفة مكتبية',
      blueCollar: 'وظيفة يدوية',
      mechanic: 'ميكانيكي'
    },
    languages: {
      en: 'الإنجليزية',
      es: 'الإسبانية',
      fr: 'الفرنسية',
      de: 'الألمانية',
      ar: 'العربية',
      zh: 'الصينية',
      ja: 'اليابانية'
    }
  },
  zh: {
    onboarding: {
      welcome: '欢迎使用 Saydo',
      subtitle: '让我们为您设置',
      step: '步骤',
      of: '共',
      next: '下一步',
      back: '返回',
      continue: '继续',
      skip: '跳过',
      finish: '完成'
    },
    steps: {
      language: {
        title: '语言选择',
        question: '我们使用什么语言？'
      },
      name: {
        title: '首选名称',
        question: '我应该怎么称呼您？',
        placeholder: '输入您的首选名称'
      },
      profession: {
        title: '职业DNA',
        question: '您的职业是什么？',
        manualEntry: '手动输入',
        criticalArtifacts: '作为{profession}，您的"关键工件"是什么？',
        addCustom: '添加自定义',
        customProfession: '自定义职业',
        customProfessionDesc: '输入您的职业名称',
        customArtifact: '自定义工件',
        customArtifactDesc: '输入工件名称'
      },
      informationDiet: {
        title: '信息饮食',
        socialIntelligence: {
          question: '您从哪里获得最好的想法？'
        },
        newsFocus: {
          question: '我应该为您监控哪些垂直领域？'
        },
        privacyBadge: '隐私优先'
      },
      essentials: {
        title: '基本要素',
        gender: {
          question: '性别',
          male: '男性',
          female: '女性',
          nonBinary: '非二元',
          preferNotToSay: '不愿透露'
        },
        age: {
          question: '年龄',
          placeholder: '输入您的年龄'
        },
        bloodGroup: {
          question: '血型'
        },
        bodyType: {
          question: '体型',
          weight: '体重（公斤）'
        },
        allergies: {
          question: '过敏',
          addCustom: '添加自定义过敏'
        },
        skinTone: {
          question: '肤色'
        }
      },
      health: {
        title: '健康引擎',
        question: '我们如何优化您的身体？'
      }
    },
    professions: {
      doctor: '医生',
      nurse: '护士',
      pharmacist: '药剂师',
      founder: '创始人',
      entrepreneur: '企业家',
      retiring: '退休',
      jobless: '失业',
      finance: '金融',
      marketing: '营销',
      whiteCollar: '白领',
      blueCollar: '蓝领',
      mechanic: '机械师'
    },
    languages: {
      en: '英语',
      es: '西班牙语',
      fr: '法语',
      de: '德语',
      ar: '阿拉伯语',
      zh: '中文',
      ja: '日语'
    }
  },
  ja: {
    onboarding: {
      welcome: 'Saydoへようこそ',
      subtitle: 'セットアップしましょう',
      step: 'ステップ',
      of: '/',
      next: '次へ',
      back: '戻る',
      continue: '続ける',
      skip: 'スキップ',
      finish: '完了'
    },
    steps: {
      language: {
        title: '言語選択',
        question: 'どの言語で話しますか？'
      },
      name: {
        title: '希望する名前',
        question: 'どのように呼べばよいですか？',
        placeholder: '希望する名前を入力'
      },
      profession: {
        title: '職業DNA',
        question: 'あなたの職業は何ですか？',
        manualEntry: '手動入力',
        criticalArtifacts: '{profession}として、あなたの「重要な成果物」は何ですか？',
        addCustom: 'カスタムを追加',
        customProfession: 'カスタム職業',
        customProfessionDesc: '職業名を入力',
        customArtifact: 'カスタム成果物',
        customArtifactDesc: '成果物名を入力'
      },
      informationDiet: {
        title: '情報ダイエット',
        socialIntelligence: {
          question: '最高のアイデアはどこから得ますか？'
        },
        newsFocus: {
          question: 'どの分野を監視すべきですか？'
        },
        privacyBadge: 'プライバシー第一'
      },
      essentials: {
        title: '基本事項',
        gender: {
          question: '性別',
          male: '男性',
          female: '女性',
          nonBinary: 'ノンバイナリー',
          preferNotToSay: '回答したくない'
        },
        age: {
          question: '年齢',
          placeholder: '年齢を入力'
        },
        bloodGroup: {
          question: '血液型'
        },
        bodyType: {
          question: '体型',
          weight: '体重（kg）'
        },
        allergies: {
          question: 'アレルギー',
          addCustom: 'カスタムアレルギーを追加'
        },
        skinTone: {
          question: '肌の色'
        }
      },
      health: {
        title: 'ヘルスエンジン',
        question: 'どのように体を最適化しますか？'
      }
    },
    professions: {
      doctor: '医師',
      nurse: '看護師',
      pharmacist: '薬剤師',
      founder: '創業者',
      entrepreneur: '起業家',
      retiring: '退職',
      jobless: '無職',
      finance: '金融',
      marketing: 'マーケティング',
      whiteCollar: 'ホワイトカラー',
      blueCollar: 'ブルーカラー',
      mechanic: 'メカニック'
    },
    languages: {
      en: '英語',
      es: 'スペイン語',
      fr: 'フランス語',
      de: 'ドイツ語',
      ar: 'アラビア語',
      zh: '中国語',
      ja: '日本語',
      pt: 'ポルトガル語',
      it: 'イタリア語',
      ru: 'ロシア語',
      ko: '韓国語',
      hi: 'ヒンディー語',
      tr: 'トルコ語',
      nl: 'オランダ語',
      pl: 'ポーランド語',
      sv: 'スウェーデン語',
      no: 'ノルウェー語',
      da: 'デンマーク語',
      fi: 'フィンランド語',
      el: 'ギリシャ語',
      he: 'ヘブライ語',
      th: 'タイ語',
      vi: 'ベトナム語',
      id: 'インドネシア語',
      cs: 'チェコ語',
      ro: 'ルーマニア語',
      hu: 'ハンガリー語',
      uk: 'ウクライナ語',
      bg: 'ブルガリア語'
    }
  }
}

// Additional languages with full native translations
const additionalLanguages: Record<Exclude<Language, 'en' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja'>, Translations> = {
  pt: {
    onboarding: {
      welcome: 'Bem-vindo ao Saydo',
      subtitle: 'Vamos configurar você',
      step: 'Passo',
      of: 'de',
      next: 'Próximo',
      back: 'Voltar',
      continue: 'Continuar',
      skip: 'Pular',
      finish: 'Finalizar'
    },
    steps: {
      language: { title: 'Seleção de Idioma', question: 'Em qual idioma falamos?' },
      name: { title: 'Nome Preferido', question: 'Como devo te chamar?', placeholder: 'Digite seu nome preferido' },
      profession: {
        title: 'DNA Profissional',
        question: 'Qual é a sua profissão?',
        manualEntry: 'Entrada Manual',
        criticalArtifacts: 'Como {profession}, quais são seus "Artefatos Críticos"?',
        addCustom: 'Adicionar Personalizado',
        customProfession: 'Profissão Personalizada',
        customProfessionDesc: 'Digite o nome da sua profissão',
        customArtifact: 'Artefato Personalizado',
        customArtifactDesc: 'Digite o nome do artefato'
      },
      informationDiet: {
        title: 'Dieta de Informação',
        socialIntelligence: { question: 'De onde você obtém suas melhores ideias?' },
        newsFocus: { question: 'Quais setores devo monitorar para você?' },
        privacyBadge: 'Privacidade em Primeiro'
      },
      essentials: {
        title: 'O Essencial',
        gender: { question: 'Gênero', male: 'Masculino', female: 'Feminino', nonBinary: 'Não-binário', preferNotToSay: 'Prefiro não dizer' },
        age: { question: 'Idade', placeholder: 'Digite sua idade' },
        bloodGroup: { question: 'Tipo Sanguíneo' },
        bodyType: { question: 'Tipo Corporal', weight: 'Peso (kg)' },
        allergies: { question: 'Alergias', addCustom: 'Adicionar Alergia Personalizada' },
        skinTone: { question: 'Tom de Pele' }
      },
      health: { title: 'Motor de Saúde', question: 'Como estamos otimizando seu corpo?' }
    },
    professions: { doctor: 'Médico', nurse: 'Enfermeiro', pharmacist: 'Farmacêutico', founder: 'Fundador', entrepreneur: 'Empreendedor', retiring: 'Aposentando', jobless: 'Desempregado', finance: 'Finanças', marketing: 'Marketing', whiteCollar: 'Colarinho Branco', blueCollar: 'Colarinho Azul', mechanic: 'Mecânico' },
    languages: { en: 'Inglês', es: 'Espanhol', fr: 'Francês', de: 'Alemão', ar: 'Árabe', zh: 'Chinês', ja: 'Japonês', pt: 'Português' }
  },
  it: {
    onboarding: {
      welcome: 'Benvenuto su Saydo',
      subtitle: 'Configuriamo il tuo profilo',
      step: 'Passo',
      of: 'di',
      next: 'Avanti',
      back: 'Indietro',
      continue: 'Continua',
      skip: 'Salta',
      finish: 'Fine'
    },
    steps: {
      language: { title: 'Selezione Lingua', question: 'In quale lingua parliamo?' },
      name: { title: 'Nome Preferito', question: 'Come devo chiamarti?', placeholder: 'Inserisci il tuo nome preferito' },
      profession: {
        title: 'DNA Professionale',
        question: 'Qual è la tua professione?',
        manualEntry: 'Inserimento Manuale',
        criticalArtifacts: 'Come {profession}, quali sono i tuoi "Artefatti Critici"?',
        addCustom: 'Aggiungi Personalizzato',
        customProfession: 'Professione Personalizzata',
        customProfessionDesc: 'Inserisci il nome della tua professione',
        customArtifact: 'Artefatto Personalizzato',
        customArtifactDesc: 'Inserisci il nome dell\'artefatto'
      },
      informationDiet: {
        title: 'Dieta Informativa',
        socialIntelligence: { question: 'Da dove ottieni le tue migliori idee?' },
        newsFocus: { question: 'Quali settori devo monitorare per te?' },
        privacyBadge: 'Privacy Prima'
      },
      essentials: {
        title: 'L\'Essenziale',
        gender: { question: 'Genere', male: 'Maschio', female: 'Femmina', nonBinary: 'Non-binario', preferNotToSay: 'Preferisco non dire' },
        age: { question: 'Età', placeholder: 'Inserisci la tua età' },
        bloodGroup: { question: 'Gruppo Sanguigno' },
        bodyType: { question: 'Tipo di Corpo', weight: 'Peso (kg)' },
        allergies: { question: 'Allergie', addCustom: 'Aggiungi Allergia Personalizzata' },
        skinTone: { question: 'Tonalità della Pelle' }
      },
      health: { title: 'Motore della Salute', question: 'Come stiamo ottimizzando il tuo corpo?' }
    },
    professions: { doctor: 'Medico', nurse: 'Infermiere', pharmacist: 'Farmacista', founder: 'Fondatore', entrepreneur: 'Imprenditore', retiring: 'In Pensione', jobless: 'Disoccupato', finance: 'Finanza', marketing: 'Marketing', whiteCollar: 'Colletto Bianco', blueCollar: 'Colletto Blu', mechanic: 'Meccanico' },
    languages: { en: 'Inglese', es: 'Spagnolo', fr: 'Francese', de: 'Tedesco', ar: 'Arabo', zh: 'Cinese', ja: 'Giapponese', it: 'Italiano' }
  },
  ru: {
    onboarding: {
      welcome: 'Добро пожаловать в Saydo',
      subtitle: 'Давайте настроим вас',
      step: 'Шаг',
      of: 'из',
      next: 'Далее',
      back: 'Назад',
      continue: 'Продолжить',
      skip: 'Пропустить',
      finish: 'Завершить'
    },
    steps: {
      language: { title: 'Выбор языка', question: 'На каком языке мы говорим?' },
      name: { title: 'Предпочитаемое имя', question: 'Как мне вас называть?', placeholder: 'Введите ваше имя' },
      profession: {
        title: 'Профессиональная ДНК',
        question: 'Какая у вас профессия?',
        manualEntry: 'Ручной ввод',
        criticalArtifacts: 'Как {profession}, какие ваши "Критические артефакты"?',
        addCustom: 'Добавить свой',
        customProfession: 'Своя профессия',
        customProfessionDesc: 'Введите название профессии',
        customArtifact: 'Свой артефакт',
        customArtifactDesc: 'Введите название артефакта'
      },
      informationDiet: {
        title: 'Информационная диета',
        socialIntelligence: { question: 'Откуда вы получаете лучшие идеи?' },
        newsFocus: { question: 'Какие отрасли мне отслеживать для вас?' },
        privacyBadge: 'Приватность прежде всего'
      },
      essentials: {
        title: 'Основное',
        gender: { question: 'Пол', male: 'Мужской', female: 'Женский', nonBinary: 'Небинарный', preferNotToSay: 'Не хочу говорить' },
        age: { question: 'Возраст', placeholder: 'Введите ваш возраст' },
        bloodGroup: { question: 'Группа крови' },
        bodyType: { question: 'Тип телосложения', weight: 'Вес (кг)' },
        allergies: { question: 'Аллергии', addCustom: 'Добавить свою аллергию' },
        skinTone: { question: 'Тон кожи' }
      },
      health: { title: 'Двигатель здоровья', question: 'Как мы оптимизируем ваше тело?' }
    },
    professions: { doctor: 'Врач', nurse: 'Медсестра', pharmacist: 'Фармацевт', founder: 'Основатель', entrepreneur: 'Предприниматель', retiring: 'На пенсии', jobless: 'Безработный', finance: 'Финансы', marketing: 'Маркетинг', whiteCollar: 'Офисный работник', blueCollar: 'Рабочий', mechanic: 'Механик' },
    languages: { en: 'Английский', es: 'Испанский', fr: 'Французский', de: 'Немецкий', ar: 'Арабский', zh: 'Китайский', ja: 'Японский', ru: 'Русский' }
  },
  ko: {
    onboarding: {
      welcome: 'Saydo에 오신 것을 환영합니다',
      subtitle: '설정을 시작합니다',
      step: '단계',
      of: '/',
      next: '다음',
      back: '이전',
      continue: '계속',
      skip: '건너뛰기',
      finish: '완료'
    },
    steps: {
      language: { title: '언어 선택', question: '어떤 언어로 대화할까요?' },
      name: { title: '선호하는 이름', question: '어떻게 불러드릴까요?', placeholder: '선호하는 이름을 입력하세요' },
      profession: {
        title: '직업 DNA',
        question: '직업이 무엇인가요?',
        manualEntry: '직접 입력',
        criticalArtifacts: '{profession}로서, 당신의 "핵심 산출물"은 무엇인가요?',
        addCustom: '사용자 정의 추가',
        customProfession: '사용자 정의 직업',
        customProfessionDesc: '직업명을 입력하세요',
        customArtifact: '사용자 정의 산출물',
        customArtifactDesc: '산출물 이름을 입력하세요'
      },
      informationDiet: {
        title: '정보 다이어트',
        socialIntelligence: { question: '어디서 최고의 아이디어를 얻으시나요?' },
        newsFocus: { question: '어떤 분야를 모니터링할까요?' },
        privacyBadge: '프라이버시 우선'
      },
      essentials: {
        title: '기본 정보',
        gender: { question: '성별', male: '남성', female: '여성', nonBinary: '논바이너리', preferNotToSay: '밝히고 싶지 않음' },
        age: { question: '나이', placeholder: '나이를 입력하세요' },
        bloodGroup: { question: '혈액형' },
        bodyType: { question: '체형', weight: '체중 (kg)' },
        allergies: { question: '알레르기', addCustom: '사용자 정의 알레르기 추가' },
        skinTone: { question: '피부톤' }
      },
      health: { title: '건강 엔진', question: '어떻게 몸을 최적화할까요?' }
    },
    professions: { doctor: '의사', nurse: '간호사', pharmacist: '약사', founder: '창업자', entrepreneur: '기업가', retiring: '은퇴', jobless: '무직', finance: '금융', marketing: '마케팅', whiteCollar: '사무직', blueCollar: '생산직', mechanic: '정비사' },
    languages: { en: '영어', es: '스페인어', fr: '프랑스어', de: '독일어', ar: '아랍어', zh: '중국어', ja: '일본어', ko: '한국어' }
  },
  hi: {
    onboarding: {
      welcome: 'Saydo में आपका स्वागत है',
      subtitle: 'आइए आपको सेटअप करें',
      step: 'चरण',
      of: 'का',
      next: 'अगला',
      back: 'पीछे',
      continue: 'जारी रखें',
      skip: 'छोड़ें',
      finish: 'समाप्त'
    },
    steps: {
      language: { title: 'भाषा चयन', question: 'हम किस भाषा में बात करें?' },
      name: { title: 'पसंदीदा नाम', question: 'मैं आपको क्या बुलाऊं?', placeholder: 'अपना पसंदीदा नाम दर्ज करें' },
      profession: {
        title: 'पेशेवर DNA',
        question: 'आपका पेशा क्या है?',
        manualEntry: 'मैन्युअल प्रविष्टि',
        criticalArtifacts: 'एक {profession} के रूप में, आपके "महत्वपूर्ण आर्टिफैक्ट्स" क्या हैं?',
        addCustom: 'कस्टम जोड़ें',
        customProfession: 'कस्टम पेशा',
        customProfessionDesc: 'अपने पेशे का नाम दर्ज करें',
        customArtifact: 'कस्टम आर्टिफैक्ट',
        customArtifactDesc: 'आर्टिफैक्ट का नाम दर्ज करें'
      },
      informationDiet: {
        title: 'सूचना आहार',
        socialIntelligence: { question: 'आप अपने सर्वोत्तम विचार कहाँ से प्राप्त करते हैं?' },
        newsFocus: { question: 'मुझे आपके लिए कौन से क्षेत्र मॉनिटर करने चाहिए?' },
        privacyBadge: 'गोपनीयता पहले'
      },
      essentials: {
        title: 'आवश्यक जानकारी',
        gender: { question: 'लिंग', male: 'पुरुष', female: 'महिला', nonBinary: 'नॉन-बाइनरी', preferNotToSay: 'बताना नहीं चाहते' },
        age: { question: 'आयु', placeholder: 'अपनी आयु दर्ज करें' },
        bloodGroup: { question: 'रक्त समूह' },
        bodyType: { question: 'शरीर का प्रकार', weight: 'वजन (किग्रा)' },
        allergies: { question: 'एलर्जी', addCustom: 'कस्टम एलर्जी जोड़ें' },
        skinTone: { question: 'त्वचा का रंग' }
      },
      health: { title: 'स्वास्थ्य इंजन', question: 'हम आपके शरीर को कैसे अनुकूलित करें?' }
    },
    professions: { doctor: 'डॉक्टर', nurse: 'नर्स', pharmacist: 'फार्मासिस्ट', founder: 'संस्थापक', entrepreneur: 'उद्यमी', retiring: 'सेवानिवृत्त', jobless: 'बेरोजगार', finance: 'वित्त', marketing: 'मार्केटिंग', whiteCollar: 'व्हाइट कॉलर', blueCollar: 'ब्लू कॉलर', mechanic: 'मैकेनिक' },
    languages: { en: 'अंग्रेज़ी', es: 'स्पेनिश', fr: 'फ्रेंच', de: 'जर्मन', ar: 'अरबी', zh: 'चीनी', ja: 'जापानी', hi: 'हिंदी' }
  },
  tr: {
    onboarding: {
      welcome: 'Saydo\'ya Hoş Geldiniz',
      subtitle: 'Sizi ayarlayalım',
      step: 'Adım',
      of: '/',
      next: 'İleri',
      back: 'Geri',
      continue: 'Devam',
      skip: 'Atla',
      finish: 'Bitir'
    },
    steps: {
      language: { title: 'Dil Seçimi', question: 'Hangi dilde konuşuyoruz?' },
      name: { title: 'Tercih Edilen İsim', question: 'Size ne diye hitap edeyim?', placeholder: 'Tercih ettiğiniz ismi girin' },
      profession: {
        title: 'Profesyonel DNA',
        question: 'Mesleğiniz nedir?',
        manualEntry: 'Manuel Giriş',
        criticalArtifacts: 'Bir {profession} olarak, "Kritik Eserleriniz" nelerdir?',
        addCustom: 'Özel Ekle',
        customProfession: 'Özel Meslek',
        customProfessionDesc: 'Meslek adınızı girin',
        customArtifact: 'Özel Eser',
        customArtifactDesc: 'Eser adını girin'
      },
      informationDiet: {
        title: 'Bilgi Diyeti',
        socialIntelligence: { question: 'En iyi fikirlerinizi nereden alıyorsunuz?' },
        newsFocus: { question: 'Sizin için hangi sektörleri izlemeliyim?' },
        privacyBadge: 'Gizlilik Öncelikli'
      },
      essentials: {
        title: 'Temel Bilgiler',
        gender: { question: 'Cinsiyet', male: 'Erkek', female: 'Kadın', nonBinary: 'Non-binary', preferNotToSay: 'Söylemeyi tercih etmiyorum' },
        age: { question: 'Yaş', placeholder: 'Yaşınızı girin' },
        bloodGroup: { question: 'Kan Grubu' },
        bodyType: { question: 'Vücut Tipi', weight: 'Ağırlık (kg)' },
        allergies: { question: 'Alerjiler', addCustom: 'Özel Alerji Ekle' },
        skinTone: { question: 'Cilt Tonu' }
      },
      health: { title: 'Sağlık Motoru', question: 'Vücudunuzu nasıl optimize ediyoruz?' }
    },
    professions: { doctor: 'Doktor', nurse: 'Hemşire', pharmacist: 'Eczacı', founder: 'Kurucu', entrepreneur: 'Girişimci', retiring: 'Emekli', jobless: 'İşsiz', finance: 'Finans', marketing: 'Pazarlama', whiteCollar: 'Beyaz Yaka', blueCollar: 'Mavi Yaka', mechanic: 'Tamirci' },
    languages: { en: 'İngilizce', es: 'İspanyolca', fr: 'Fransızca', de: 'Almanca', ar: 'Arapça', zh: 'Çince', ja: 'Japonca', tr: 'Türkçe' }
  },
  nl: {
    onboarding: {
      welcome: 'Welkom bij Saydo',
      subtitle: 'Laten we je instellen',
      step: 'Stap',
      of: 'van',
      next: 'Volgende',
      back: 'Terug',
      continue: 'Doorgaan',
      skip: 'Overslaan',
      finish: 'Voltooien'
    },
    steps: {
      language: { title: 'Taalkeuze', question: 'In welke taal spreken we?' },
      name: { title: 'Voorkeursnaam', question: 'Hoe moet ik je noemen?', placeholder: 'Voer je voorkeursnaam in' },
      profession: {
        title: 'Professioneel DNA',
        question: 'Wat is je beroep?',
        manualEntry: 'Handmatige invoer',
        criticalArtifacts: 'Als {profession}, wat zijn je "Kritieke Artefacten"?',
        addCustom: 'Aangepast toevoegen',
        customProfession: 'Aangepast beroep',
        customProfessionDesc: 'Voer je beroepsnaam in',
        customArtifact: 'Aangepast artefact',
        customArtifactDesc: 'Voer artefactnaam in'
      },
      informationDiet: {
        title: 'Informatiedieet',
        socialIntelligence: { question: 'Waar haal je je beste ideeën vandaan?' },
        newsFocus: { question: 'Welke sectoren moet ik voor je monitoren?' },
        privacyBadge: 'Privacy Eerst'
      },
      essentials: {
        title: 'De Basis',
        gender: { question: 'Geslacht', male: 'Man', female: 'Vrouw', nonBinary: 'Non-binair', preferNotToSay: 'Zeg ik liever niet' },
        age: { question: 'Leeftijd', placeholder: 'Voer je leeftijd in' },
        bloodGroup: { question: 'Bloedgroep' },
        bodyType: { question: 'Lichaamstype', weight: 'Gewicht (kg)' },
        allergies: { question: 'Allergieën', addCustom: 'Aangepaste allergie toevoegen' },
        skinTone: { question: 'Huidskleur' }
      },
      health: { title: 'Gezondheidsmotor', question: 'Hoe optimaliseren we je lichaam?' }
    },
    professions: { doctor: 'Arts', nurse: 'Verpleegkundige', pharmacist: 'Apotheker', founder: 'Oprichter', entrepreneur: 'Ondernemer', retiring: 'Met pensioen', jobless: 'Werkloos', finance: 'Financiën', marketing: 'Marketing', whiteCollar: 'Kantoorwerk', blueCollar: 'Handwerk', mechanic: 'Monteur' },
    languages: { en: 'Engels', es: 'Spaans', fr: 'Frans', de: 'Duits', ar: 'Arabisch', zh: 'Chinees', ja: 'Japans', nl: 'Nederlands' }
  },
  pl: {
    onboarding: {
      welcome: 'Witamy w Saydo',
      subtitle: 'Skonfigurujmy cię',
      step: 'Krok',
      of: 'z',
      next: 'Dalej',
      back: 'Wstecz',
      continue: 'Kontynuuj',
      skip: 'Pomiń',
      finish: 'Zakończ'
    },
    steps: {
      language: { title: 'Wybór języka', question: 'W jakim języku rozmawiamy?' },
      name: { title: 'Preferowane imię', question: 'Jak mam do ciebie mówić?', placeholder: 'Wpisz preferowane imię' },
      profession: {
        title: 'Profesjonalne DNA',
        question: 'Jaki jest twój zawód?',
        manualEntry: 'Ręczne wprowadzanie',
        criticalArtifacts: 'Jako {profession}, jakie są twoje "Krytyczne artefakty"?',
        addCustom: 'Dodaj niestandardowy',
        customProfession: 'Niestandardowy zawód',
        customProfessionDesc: 'Wpisz nazwę zawodu',
        customArtifact: 'Niestandardowy artefakt',
        customArtifactDesc: 'Wpisz nazwę artefaktu'
      },
      informationDiet: {
        title: 'Dieta informacyjna',
        socialIntelligence: { question: 'Skąd czerpiesz najlepsze pomysły?' },
        newsFocus: { question: 'Jakie branże mam dla ciebie monitorować?' },
        privacyBadge: 'Prywatność przede wszystkim'
      },
      essentials: {
        title: 'Podstawy',
        gender: { question: 'Płeć', male: 'Mężczyzna', female: 'Kobieta', nonBinary: 'Niebinarna', preferNotToSay: 'Wolę nie mówić' },
        age: { question: 'Wiek', placeholder: 'Wpisz swój wiek' },
        bloodGroup: { question: 'Grupa krwi' },
        bodyType: { question: 'Typ sylwetki', weight: 'Waga (kg)' },
        allergies: { question: 'Alergie', addCustom: 'Dodaj niestandardową alergię' },
        skinTone: { question: 'Kolor skóry' }
      },
      health: { title: 'Silnik zdrowia', question: 'Jak optymalizujemy twoje ciało?' }
    },
    professions: { doctor: 'Lekarz', nurse: 'Pielęgniarka', pharmacist: 'Farmaceuta', founder: 'Założyciel', entrepreneur: 'Przedsiębiorca', retiring: 'Na emeryturze', jobless: 'Bezrobotny', finance: 'Finanse', marketing: 'Marketing', whiteCollar: 'Pracownik biurowy', blueCollar: 'Pracownik fizyczny', mechanic: 'Mechanik' },
    languages: { en: 'Angielski', es: 'Hiszpański', fr: 'Francuski', de: 'Niemiecki', ar: 'Arabski', zh: 'Chiński', ja: 'Japoński', pl: 'Polski' }
  },
  sv: {
    onboarding: {
      welcome: 'Välkommen till Saydo',
      subtitle: 'Låt oss konfigurera dig',
      step: 'Steg',
      of: 'av',
      next: 'Nästa',
      back: 'Tillbaka',
      continue: 'Fortsätt',
      skip: 'Hoppa över',
      finish: 'Slutför'
    },
    steps: {
      language: { title: 'Språkval', question: 'Vilket språk pratar vi?' },
      name: { title: 'Föredraget namn', question: 'Vad ska jag kalla dig?', placeholder: 'Ange ditt föredragna namn' },
      profession: {
        title: 'Professionellt DNA',
        question: 'Vad är ditt yrke?',
        manualEntry: 'Manuell inmatning',
        criticalArtifacts: 'Som {profession}, vilka är dina "Kritiska artefakter"?',
        addCustom: 'Lägg till anpassad',
        customProfession: 'Anpassat yrke',
        customProfessionDesc: 'Ange ditt yrkesnamn',
        customArtifact: 'Anpassad artefakt',
        customArtifactDesc: 'Ange artefaktnamn'
      },
      informationDiet: {
        title: 'Informationsdiet',
        socialIntelligence: { question: 'Var får du dina bästa idéer?' },
        newsFocus: { question: 'Vilka branscher ska jag övervaka åt dig?' },
        privacyBadge: 'Integritet först'
      },
      essentials: {
        title: 'Grunderna',
        gender: { question: 'Kön', male: 'Man', female: 'Kvinna', nonBinary: 'Icke-binär', preferNotToSay: 'Vill inte säga' },
        age: { question: 'Ålder', placeholder: 'Ange din ålder' },
        bloodGroup: { question: 'Blodgrupp' },
        bodyType: { question: 'Kroppstyp', weight: 'Vikt (kg)' },
        allergies: { question: 'Allergier', addCustom: 'Lägg till anpassad allergi' },
        skinTone: { question: 'Hudton' }
      },
      health: { title: 'Hälsomotor', question: 'Hur optimerar vi din kropp?' }
    },
    professions: { doctor: 'Läkare', nurse: 'Sjuksköterska', pharmacist: 'Farmaceut', founder: 'Grundare', entrepreneur: 'Entreprenör', retiring: 'Pensionär', jobless: 'Arbetslös', finance: 'Finans', marketing: 'Marknadsföring', whiteCollar: 'Tjänsteman', blueCollar: 'Arbetare', mechanic: 'Mekaniker' },
    languages: { en: 'Engelska', es: 'Spanska', fr: 'Franska', de: 'Tyska', ar: 'Arabiska', zh: 'Kinesiska', ja: 'Japanska', sv: 'Svenska' }
  },
  no: {
    onboarding: {
      welcome: 'Velkommen til Saydo',
      subtitle: 'La oss konfigurere deg',
      step: 'Steg',
      of: 'av',
      next: 'Neste',
      back: 'Tilbake',
      continue: 'Fortsett',
      skip: 'Hopp over',
      finish: 'Fullfør'
    },
    steps: {
      language: { title: 'Språkvalg', question: 'Hvilket språk snakker vi?' },
      name: { title: 'Foretrukket navn', question: 'Hva skal jeg kalle deg?', placeholder: 'Skriv inn ditt foretrukne navn' },
      profession: {
        title: 'Profesjonelt DNA',
        question: 'Hva er yrket ditt?',
        manualEntry: 'Manuell innføring',
        criticalArtifacts: 'Som {profession}, hva er dine "Kritiske artefakter"?',
        addCustom: 'Legg til egendefinert',
        customProfession: 'Egendefinert yrke',
        customProfessionDesc: 'Skriv inn yrkestittel',
        customArtifact: 'Egendefinert artefakt',
        customArtifactDesc: 'Skriv inn artefaktnavn'
      },
      informationDiet: {
        title: 'Informasjonsdiett',
        socialIntelligence: { question: 'Hvor får du de beste ideene dine?' },
        newsFocus: { question: 'Hvilke bransjer skal jeg overvåke for deg?' },
        privacyBadge: 'Personvern først'
      },
      essentials: {
        title: 'Det grunnleggende',
        gender: { question: 'Kjønn', male: 'Mann', female: 'Kvinne', nonBinary: 'Ikke-binær', preferNotToSay: 'Vil ikke si' },
        age: { question: 'Alder', placeholder: 'Skriv inn din alder' },
        bloodGroup: { question: 'Blodtype' },
        bodyType: { question: 'Kroppstype', weight: 'Vekt (kg)' },
        allergies: { question: 'Allergier', addCustom: 'Legg til egendefinert allergi' },
        skinTone: { question: 'Hudfarge' }
      },
      health: { title: 'Helsemotor', question: 'Hvordan optimaliserer vi kroppen din?' }
    },
    professions: { doctor: 'Lege', nurse: 'Sykepleier', pharmacist: 'Farmasøyt', founder: 'Grunnlegger', entrepreneur: 'Gründer', retiring: 'Pensjonist', jobless: 'Arbeidsledig', finance: 'Finans', marketing: 'Markedsføring', whiteCollar: 'Funksjonær', blueCollar: 'Arbeider', mechanic: 'Mekaniker' },
    languages: { en: 'Engelsk', es: 'Spansk', fr: 'Fransk', de: 'Tysk', ar: 'Arabisk', zh: 'Kinesisk', ja: 'Japansk', no: 'Norsk' }
  },
  da: {
    onboarding: {
      welcome: 'Velkommen til Saydo',
      subtitle: 'Lad os konfigurere dig',
      step: 'Trin',
      of: 'af',
      next: 'Næste',
      back: 'Tilbage',
      continue: 'Fortsæt',
      skip: 'Spring over',
      finish: 'Afslut'
    },
    steps: {
      language: { title: 'Sprogvalg', question: 'Hvilket sprog taler vi?' },
      name: { title: 'Foretrukket navn', question: 'Hvad skal jeg kalde dig?', placeholder: 'Indtast dit foretrukne navn' },
      profession: {
        title: 'Professionelt DNA',
        question: 'Hvad er din profession?',
        manualEntry: 'Manuel indtastning',
        criticalArtifacts: 'Som {profession}, hvad er dine "Kritiske artefakter"?',
        addCustom: 'Tilføj brugerdefineret',
        customProfession: 'Brugerdefineret profession',
        customProfessionDesc: 'Indtast professionsnavn',
        customArtifact: 'Brugerdefineret artefakt',
        customArtifactDesc: 'Indtast artefaktnavn'
      },
      informationDiet: {
        title: 'Informationsdiet',
        socialIntelligence: { question: 'Hvor får du dine bedste ideer?' },
        newsFocus: { question: 'Hvilke brancher skal jeg overvåge for dig?' },
        privacyBadge: 'Privatliv først'
      },
      essentials: {
        title: 'Det grundlæggende',
        gender: { question: 'Køn', male: 'Mand', female: 'Kvinde', nonBinary: 'Ikke-binær', preferNotToSay: 'Vil ikke sige' },
        age: { question: 'Alder', placeholder: 'Indtast din alder' },
        bloodGroup: { question: 'Blodtype' },
        bodyType: { question: 'Kropstype', weight: 'Vægt (kg)' },
        allergies: { question: 'Allergier', addCustom: 'Tilføj brugerdefineret allergi' },
        skinTone: { question: 'Hudfarve' }
      },
      health: { title: 'Sundhedsmotor', question: 'Hvordan optimerer vi din krop?' }
    },
    professions: { doctor: 'Læge', nurse: 'Sygeplejerske', pharmacist: 'Farmaceut', founder: 'Grundlægger', entrepreneur: 'Iværksætter', retiring: 'Pensioneret', jobless: 'Arbejdsløs', finance: 'Finans', marketing: 'Marketing', whiteCollar: 'Funktionær', blueCollar: 'Arbejder', mechanic: 'Mekaniker' },
    languages: { en: 'Engelsk', es: 'Spansk', fr: 'Fransk', de: 'Tysk', ar: 'Arabisk', zh: 'Kinesisk', ja: 'Japansk', da: 'Dansk' }
  },
  fi: {
    onboarding: {
      welcome: 'Tervetuloa Saydoon',
      subtitle: 'Määritetään asetuksesi',
      step: 'Vaihe',
      of: '/',
      next: 'Seuraava',
      back: 'Takaisin',
      continue: 'Jatka',
      skip: 'Ohita',
      finish: 'Valmis'
    },
    steps: {
      language: { title: 'Kielen valinta', question: 'Millä kielellä puhumme?' },
      name: { title: 'Haluttu nimi', question: 'Mitä kutsun sinua?', placeholder: 'Syötä haluttu nimesi' },
      profession: {
        title: 'Ammatillinen DNA',
        question: 'Mikä on ammattisi?',
        manualEntry: 'Manuaalinen syöttö',
        criticalArtifacts: '{profession} roolissa, mitkä ovat "Kriittiset artefaktisi"?',
        addCustom: 'Lisää mukautettu',
        customProfession: 'Mukautettu ammatti',
        customProfessionDesc: 'Syötä ammattisi nimi',
        customArtifact: 'Mukautettu artefakti',
        customArtifactDesc: 'Syötä artefaktin nimi'
      },
      informationDiet: {
        title: 'Tietoruokavalio',
        socialIntelligence: { question: 'Mistä saat parhaat ideasi?' },
        newsFocus: { question: 'Mitä toimialoja minun pitäisi seurata puolestasi?' },
        privacyBadge: 'Yksityisyys ensin'
      },
      essentials: {
        title: 'Perustiedot',
        gender: { question: 'Sukupuoli', male: 'Mies', female: 'Nainen', nonBinary: 'Muunsukupuolinen', preferNotToSay: 'En halua sanoa' },
        age: { question: 'Ikä', placeholder: 'Syötä ikäsi' },
        bloodGroup: { question: 'Veriryhmä' },
        bodyType: { question: 'Vartalotyyppi', weight: 'Paino (kg)' },
        allergies: { question: 'Allergiat', addCustom: 'Lisää mukautettu allergia' },
        skinTone: { question: 'Ihon sävy' }
      },
      health: { title: 'Terveysmoottori', question: 'Miten optimoimme kehoasi?' }
    },
    professions: { doctor: 'Lääkäri', nurse: 'Sairaanhoitaja', pharmacist: 'Farmaseutti', founder: 'Perustaja', entrepreneur: 'Yrittäjä', retiring: 'Eläkkeellä', jobless: 'Työtön', finance: 'Rahoitus', marketing: 'Markkinointi', whiteCollar: 'Toimistotyöntekijä', blueCollar: 'Työntekijä', mechanic: 'Mekaanikko' },
    languages: { en: 'Englanti', es: 'Espanja', fr: 'Ranska', de: 'Saksa', ar: 'Arabia', zh: 'Kiina', ja: 'Japani', fi: 'Suomi' }
  },
  el: {
    onboarding: {
      welcome: 'Καλώς ήρθατε στο Saydo',
      subtitle: 'Ας σας ρυθμίσουμε',
      step: 'Βήμα',
      of: 'από',
      next: 'Επόμενο',
      back: 'Πίσω',
      continue: 'Συνέχεια',
      skip: 'Παράβλεψη',
      finish: 'Τέλος'
    },
    steps: {
      language: { title: 'Επιλογή γλώσσας', question: 'Σε ποια γλώσσα μιλάμε;' },
      name: { title: 'Προτιμώμενο όνομα', question: 'Πώς να σας αποκαλώ;', placeholder: 'Εισάγετε το προτιμώμενο όνομά σας' },
      profession: {
        title: 'Επαγγελματικό DNA',
        question: 'Ποιο είναι το επάγγελμά σας;',
        manualEntry: 'Χειροκίνητη εισαγωγή',
        criticalArtifacts: 'Ως {profession}, ποια είναι τα "Κρίσιμα Αντικείμενά" σας;',
        addCustom: 'Προσθήκη προσαρμοσμένου',
        customProfession: 'Προσαρμοσμένο επάγγελμα',
        customProfessionDesc: 'Εισάγετε το όνομα του επαγγέλματος',
        customArtifact: 'Προσαρμοσμένο αντικείμενο',
        customArtifactDesc: 'Εισάγετε το όνομα του αντικειμένου'
      },
      informationDiet: {
        title: 'Διατροφή Πληροφοριών',
        socialIntelligence: { question: 'Από πού παίρνετε τις καλύτερες ιδέες σας;' },
        newsFocus: { question: 'Ποιους τομείς να παρακολουθώ για εσάς;' },
        privacyBadge: 'Ιδιωτικότητα Πρώτα'
      },
      essentials: {
        title: 'Τα Βασικά',
        gender: { question: 'Φύλο', male: 'Άνδρας', female: 'Γυναίκα', nonBinary: 'Μη δυαδικό', preferNotToSay: 'Προτιμώ να μην πω' },
        age: { question: 'Ηλικία', placeholder: 'Εισάγετε την ηλικία σας' },
        bloodGroup: { question: 'Ομάδα αίματος' },
        bodyType: { question: 'Τύπος σώματος', weight: 'Βάρος (kg)' },
        allergies: { question: 'Αλλεργίες', addCustom: 'Προσθήκη προσαρμοσμένης αλλεργίας' },
        skinTone: { question: 'Τόνος δέρματος' }
      },
      health: { title: 'Μηχανή Υγείας', question: 'Πώς βελτιστοποιούμε το σώμα σας;' }
    },
    professions: { doctor: 'Γιατρός', nurse: 'Νοσοκόμα', pharmacist: 'Φαρμακοποιός', founder: 'Ιδρυτής', entrepreneur: 'Επιχειρηματίας', retiring: 'Συνταξιούχος', jobless: 'Άνεργος', finance: 'Χρηματοοικονομικά', marketing: 'Μάρκετινγκ', whiteCollar: 'Υπάλληλος γραφείου', blueCollar: 'Εργάτης', mechanic: 'Μηχανικός' },
    languages: { en: 'Αγγλικά', es: 'Ισπανικά', fr: 'Γαλλικά', de: 'Γερμανικά', ar: 'Αραβικά', zh: 'Κινέζικα', ja: 'Ιαπωνικά', el: 'Ελληνικά' }
  },
  he: {
    onboarding: {
      welcome: 'ברוכים הבאים ל-Saydo',
      subtitle: 'בואו נגדיר אותך',
      step: 'שלב',
      of: 'מתוך',
      next: 'הבא',
      back: 'חזרה',
      continue: 'המשך',
      skip: 'דלג',
      finish: 'סיום'
    },
    steps: {
      language: { title: 'בחירת שפה', question: 'באיזו שפה אנחנו מדברים?' },
      name: { title: 'שם מועדף', question: 'איך לקרוא לך?', placeholder: 'הכנס את שמך המועדף' },
      profession: {
        title: 'DNA מקצועי',
        question: 'מה המקצוע שלך?',
        manualEntry: 'הזנה ידנית',
        criticalArtifacts: 'כ-{profession}, מהם ה"פריטים הקריטיים" שלך?',
        addCustom: 'הוסף מותאם אישית',
        customProfession: 'מקצוע מותאם אישית',
        customProfessionDesc: 'הכנס את שם המקצוע',
        customArtifact: 'פריט מותאם אישית',
        customArtifactDesc: 'הכנס את שם הפריט'
      },
      informationDiet: {
        title: 'דיאטת מידע',
        socialIntelligence: { question: 'מאיפה אתה מקבל את הרעיונות הטובים ביותר?' },
        newsFocus: { question: 'אילו תחומים עלי לעקוב עבורך?' },
        privacyBadge: 'פרטיות קודמת'
      },
      essentials: {
        title: 'הבסיסיים',
        gender: { question: 'מגדר', male: 'זכר', female: 'נקבה', nonBinary: 'לא-בינארי', preferNotToSay: 'מעדיף לא לומר' },
        age: { question: 'גיל', placeholder: 'הכנס את גילך' },
        bloodGroup: { question: 'סוג דם' },
        bodyType: { question: 'מבנה גוף', weight: 'משקל (ק"ג)' },
        allergies: { question: 'אלרגיות', addCustom: 'הוסף אלרגיה מותאמת אישית' },
        skinTone: { question: 'גוון עור' }
      },
      health: { title: 'מנוע בריאות', question: 'איך אנחנו מייעלים את הגוף שלך?' }
    },
    professions: { doctor: 'רופא', nurse: 'אחות', pharmacist: 'רוקח', founder: 'מייסד', entrepreneur: 'יזם', retiring: 'פורש', jobless: 'מובטל', finance: 'פיננסים', marketing: 'שיווק', whiteCollar: 'עובד משרד', blueCollar: 'עובד כפיים', mechanic: 'מכונאי' },
    languages: { en: 'אנגלית', es: 'ספרדית', fr: 'צרפתית', de: 'גרמנית', ar: 'ערבית', zh: 'סינית', ja: 'יפנית', he: 'עברית' }
  },
  th: {
    onboarding: {
      welcome: 'ยินดีต้อนรับสู่ Saydo',
      subtitle: 'มาตั้งค่าให้คุณกัน',
      step: 'ขั้นตอน',
      of: 'จาก',
      next: 'ถัดไป',
      back: 'ย้อนกลับ',
      continue: 'ดำเนินการต่อ',
      skip: 'ข้าม',
      finish: 'เสร็จสิ้น'
    },
    steps: {
      language: { title: 'เลือกภาษา', question: 'เราพูดภาษาอะไร?' },
      name: { title: 'ชื่อที่ต้องการ', question: 'ฉันควรเรียกคุณว่าอะไร?', placeholder: 'กรอกชื่อที่ต้องการ' },
      profession: {
        title: 'DNA อาชีพ',
        question: 'อาชีพของคุณคืออะไร?',
        manualEntry: 'กรอกด้วยตนเอง',
        criticalArtifacts: 'ในฐานะ {profession} "สิ่งประดิษฐ์ที่สำคัญ" ของคุณคืออะไร?',
        addCustom: 'เพิ่มกำหนดเอง',
        customProfession: 'อาชีพกำหนดเอง',
        customProfessionDesc: 'กรอกชื่ออาชีพ',
        customArtifact: 'สิ่งประดิษฐ์กำหนดเอง',
        customArtifactDesc: 'กรอกชื่อสิ่งประดิษฐ์'
      },
      informationDiet: {
        title: 'อาหารข้อมูล',
        socialIntelligence: { question: 'คุณได้ไอเดียดีๆ จากที่ไหน?' },
        newsFocus: { question: 'ฉันควรติดตามอุตสาหกรรมใดให้คุณ?' },
        privacyBadge: 'ความเป็นส่วนตัวมาก่อน'
      },
      essentials: {
        title: 'ข้อมูลพื้นฐาน',
        gender: { question: 'เพศ', male: 'ชาย', female: 'หญิง', nonBinary: 'ไม่ระบุเพศ', preferNotToSay: 'ไม่ต้องการระบุ' },
        age: { question: 'อายุ', placeholder: 'กรอกอายุของคุณ' },
        bloodGroup: { question: 'หมู่เลือด' },
        bodyType: { question: 'รูปร่าง', weight: 'น้ำหนัก (กก.)' },
        allergies: { question: 'การแพ้', addCustom: 'เพิ่มการแพ้กำหนดเอง' },
        skinTone: { question: 'สีผิว' }
      },
      health: { title: 'เครื่องยนต์สุขภาพ', question: 'เราจะปรับปรุงร่างกายของคุณอย่างไร?' }
    },
    professions: { doctor: 'แพทย์', nurse: 'พยาบาล', pharmacist: 'เภสัชกร', founder: 'ผู้ก่อตั้ง', entrepreneur: 'ผู้ประกอบการ', retiring: 'เกษียณ', jobless: 'ว่างงาน', finance: 'การเงิน', marketing: 'การตลาด', whiteCollar: 'พนักงานออฟฟิศ', blueCollar: 'แรงงาน', mechanic: 'ช่างเครื่อง' },
    languages: { en: 'อังกฤษ', es: 'สเปน', fr: 'ฝรั่งเศส', de: 'เยอรมัน', ar: 'อาหรับ', zh: 'จีน', ja: 'ญี่ปุ่น', th: 'ไทย' }
  },
  vi: {
    onboarding: {
      welcome: 'Chào mừng đến với Saydo',
      subtitle: 'Hãy thiết lập cho bạn',
      step: 'Bước',
      of: '/',
      next: 'Tiếp',
      back: 'Quay lại',
      continue: 'Tiếp tục',
      skip: 'Bỏ qua',
      finish: 'Hoàn thành'
    },
    steps: {
      language: { title: 'Chọn ngôn ngữ', question: 'Chúng ta nói ngôn ngữ gì?' },
      name: { title: 'Tên ưa thích', question: 'Tôi nên gọi bạn là gì?', placeholder: 'Nhập tên ưa thích của bạn' },
      profession: {
        title: 'DNA Nghề nghiệp',
        question: 'Nghề nghiệp của bạn là gì?',
        manualEntry: 'Nhập thủ công',
        criticalArtifacts: 'Là {profession}, "Sản phẩm quan trọng" của bạn là gì?',
        addCustom: 'Thêm tùy chỉnh',
        customProfession: 'Nghề tùy chỉnh',
        customProfessionDesc: 'Nhập tên nghề nghiệp',
        customArtifact: 'Sản phẩm tùy chỉnh',
        customArtifactDesc: 'Nhập tên sản phẩm'
      },
      informationDiet: {
        title: 'Chế độ thông tin',
        socialIntelligence: { question: 'Bạn lấy ý tưởng tốt nhất từ đâu?' },
        newsFocus: { question: 'Tôi nên theo dõi ngành nào cho bạn?' },
        privacyBadge: 'Quyền riêng tư trước tiên'
      },
      essentials: {
        title: 'Thông tin cơ bản',
        gender: { question: 'Giới tính', male: 'Nam', female: 'Nữ', nonBinary: 'Phi nhị nguyên', preferNotToSay: 'Không muốn nói' },
        age: { question: 'Tuổi', placeholder: 'Nhập tuổi của bạn' },
        bloodGroup: { question: 'Nhóm máu' },
        bodyType: { question: 'Vóc dáng', weight: 'Cân nặng (kg)' },
        allergies: { question: 'Dị ứng', addCustom: 'Thêm dị ứng tùy chỉnh' },
        skinTone: { question: 'Màu da' }
      },
      health: { title: 'Động cơ sức khỏe', question: 'Chúng tôi tối ưu hóa cơ thể bạn như thế nào?' }
    },
    professions: { doctor: 'Bác sĩ', nurse: 'Y tá', pharmacist: 'Dược sĩ', founder: 'Nhà sáng lập', entrepreneur: 'Doanh nhân', retiring: 'Nghỉ hưu', jobless: 'Thất nghiệp', finance: 'Tài chính', marketing: 'Marketing', whiteCollar: 'Nhân viên văn phòng', blueCollar: 'Công nhân', mechanic: 'Thợ máy' },
    languages: { en: 'Tiếng Anh', es: 'Tiếng Tây Ban Nha', fr: 'Tiếng Pháp', de: 'Tiếng Đức', ar: 'Tiếng Ả Rập', zh: 'Tiếng Trung', ja: 'Tiếng Nhật', vi: 'Tiếng Việt' }
  },
  id: {
    onboarding: {
      welcome: 'Selamat datang di Saydo',
      subtitle: 'Mari kita atur profil Anda',
      step: 'Langkah',
      of: 'dari',
      next: 'Berikutnya',
      back: 'Kembali',
      continue: 'Lanjutkan',
      skip: 'Lewati',
      finish: 'Selesai'
    },
    steps: {
      language: { title: 'Pilihan Bahasa', question: 'Bahasa apa yang kita gunakan?' },
      name: { title: 'Nama Pilihan', question: 'Apa nama panggilan Anda?', placeholder: 'Masukkan nama pilihan Anda' },
      profession: {
        title: 'DNA Profesional',
        question: 'Apa profesi Anda?',
        manualEntry: 'Input Manual',
        criticalArtifacts: 'Sebagai {profession}, apa "Artefak Kritis" Anda?',
        addCustom: 'Tambah Kustom',
        customProfession: 'Profesi Kustom',
        customProfessionDesc: 'Masukkan nama profesi',
        customArtifact: 'Artefak Kustom',
        customArtifactDesc: 'Masukkan nama artefak'
      },
      informationDiet: {
        title: 'Diet Informasi',
        socialIntelligence: { question: 'Dari mana Anda mendapatkan ide terbaik?' },
        newsFocus: { question: 'Industri apa yang harus saya pantau untuk Anda?' },
        privacyBadge: 'Privasi Utama'
      },
      essentials: {
        title: 'Hal Penting',
        gender: { question: 'Jenis Kelamin', male: 'Laki-laki', female: 'Perempuan', nonBinary: 'Non-biner', preferNotToSay: 'Tidak ingin menyebutkan' },
        age: { question: 'Usia', placeholder: 'Masukkan usia Anda' },
        bloodGroup: { question: 'Golongan Darah' },
        bodyType: { question: 'Tipe Tubuh', weight: 'Berat (kg)' },
        allergies: { question: 'Alergi', addCustom: 'Tambah Alergi Kustom' },
        skinTone: { question: 'Warna Kulit' }
      },
      health: { title: 'Mesin Kesehatan', question: 'Bagaimana kami mengoptimalkan tubuh Anda?' }
    },
    professions: { doctor: 'Dokter', nurse: 'Perawat', pharmacist: 'Apoteker', founder: 'Pendiri', entrepreneur: 'Pengusaha', retiring: 'Pensiun', jobless: 'Pengangguran', finance: 'Keuangan', marketing: 'Pemasaran', whiteCollar: 'Pekerja Kantoran', blueCollar: 'Pekerja Kasar', mechanic: 'Mekanik' },
    languages: { en: 'Inggris', es: 'Spanyol', fr: 'Prancis', de: 'Jerman', ar: 'Arab', zh: 'Mandarin', ja: 'Jepang', id: 'Indonesia' }
  },
  cs: {
    onboarding: {
      welcome: 'Vítejte v Saydo',
      subtitle: 'Pojďme vás nastavit',
      step: 'Krok',
      of: 'z',
      next: 'Další',
      back: 'Zpět',
      continue: 'Pokračovat',
      skip: 'Přeskočit',
      finish: 'Dokončit'
    },
    steps: {
      language: { title: 'Výběr jazyka', question: 'Jakým jazykem mluvíme?' },
      name: { title: 'Preferované jméno', question: 'Jak vám mám říkat?', placeholder: 'Zadejte preferované jméno' },
      profession: {
        title: 'Profesní DNA',
        question: 'Jaké je vaše povolání?',
        manualEntry: 'Ruční zadání',
        criticalArtifacts: 'Jako {profession}, jaké jsou vaše "Kritické artefakty"?',
        addCustom: 'Přidat vlastní',
        customProfession: 'Vlastní povolání',
        customProfessionDesc: 'Zadejte název povolání',
        customArtifact: 'Vlastní artefakt',
        customArtifactDesc: 'Zadejte název artefaktu'
      },
      informationDiet: {
        title: 'Informační dieta',
        socialIntelligence: { question: 'Odkud získáváte nejlepší nápady?' },
        newsFocus: { question: 'Které obory mám pro vás sledovat?' },
        privacyBadge: 'Soukromí na prvním místě'
      },
      essentials: {
        title: 'Základy',
        gender: { question: 'Pohlaví', male: 'Muž', female: 'Žena', nonBinary: 'Nebinární', preferNotToSay: 'Nechci uvádět' },
        age: { question: 'Věk', placeholder: 'Zadejte svůj věk' },
        bloodGroup: { question: 'Krevní skupina' },
        bodyType: { question: 'Typ postavy', weight: 'Váha (kg)' },
        allergies: { question: 'Alergie', addCustom: 'Přidat vlastní alergii' },
        skinTone: { question: 'Odstín pleti' }
      },
      health: { title: 'Zdravotní motor', question: 'Jak optimalizujeme vaše tělo?' }
    },
    professions: { doctor: 'Lékař', nurse: 'Zdravotní sestra', pharmacist: 'Lékárník', founder: 'Zakladatel', entrepreneur: 'Podnikatel', retiring: 'V důchodu', jobless: 'Nezaměstnaný', finance: 'Finance', marketing: 'Marketing', whiteCollar: 'Kancelářský pracovník', blueCollar: 'Manuální pracovník', mechanic: 'Mechanik' },
    languages: { en: 'Angličtina', es: 'Španělština', fr: 'Francouzština', de: 'Němčina', ar: 'Arabština', zh: 'Čínština', ja: 'Japonština', cs: 'Čeština' }
  },
  ro: {
    onboarding: {
      welcome: 'Bine ați venit la Saydo',
      subtitle: 'Să vă configurăm',
      step: 'Pasul',
      of: 'din',
      next: 'Următor',
      back: 'Înapoi',
      continue: 'Continuă',
      skip: 'Sari peste',
      finish: 'Finalizează'
    },
    steps: {
      language: { title: 'Selectare limbă', question: 'În ce limbă vorbim?' },
      name: { title: 'Nume preferat', question: 'Cum să vă numesc?', placeholder: 'Introduceți numele preferat' },
      profession: {
        title: 'ADN Profesional',
        question: 'Care este profesia dumneavoastră?',
        manualEntry: 'Introducere manuală',
        criticalArtifacts: 'Ca {profession}, care sunt "Artefactele critice"?',
        addCustom: 'Adăugați personalizat',
        customProfession: 'Profesie personalizată',
        customProfessionDesc: 'Introduceți numele profesiei',
        customArtifact: 'Artefact personalizat',
        customArtifactDesc: 'Introduceți numele artefactului'
      },
      informationDiet: {
        title: 'Dieta informațională',
        socialIntelligence: { question: 'De unde obțineți cele mai bune idei?' },
        newsFocus: { question: 'Ce domenii să monitorizez pentru dvs.?' },
        privacyBadge: 'Confidențialitate mai întâi'
      },
      essentials: {
        title: 'Esențiale',
        gender: { question: 'Gen', male: 'Masculin', female: 'Feminin', nonBinary: 'Non-binar', preferNotToSay: 'Prefer să nu spun' },
        age: { question: 'Vârstă', placeholder: 'Introduceți vârsta' },
        bloodGroup: { question: 'Grupa sanguină' },
        bodyType: { question: 'Tip corp', weight: 'Greutate (kg)' },
        allergies: { question: 'Alergii', addCustom: 'Adăugați alergie personalizată' },
        skinTone: { question: 'Nuanța pielii' }
      },
      health: { title: 'Motor de sănătate', question: 'Cum optimizăm corpul dvs.?' }
    },
    professions: { doctor: 'Medic', nurse: 'Asistentă', pharmacist: 'Farmacist', founder: 'Fondator', entrepreneur: 'Antreprenor', retiring: 'Pensionar', jobless: 'Șomer', finance: 'Finanțe', marketing: 'Marketing', whiteCollar: 'Funcționar', blueCollar: 'Muncitor', mechanic: 'Mecanic' },
    languages: { en: 'Engleză', es: 'Spaniolă', fr: 'Franceză', de: 'Germană', ar: 'Arabă', zh: 'Chineză', ja: 'Japoneză', ro: 'Română' }
  },
  hu: {
    onboarding: {
      welcome: 'Üdvözöljük a Saydo-ban',
      subtitle: 'Állítsuk be a profilját',
      step: 'Lépés',
      of: '/',
      next: 'Következő',
      back: 'Vissza',
      continue: 'Folytatás',
      skip: 'Kihagyás',
      finish: 'Befejezés'
    },
    steps: {
      language: { title: 'Nyelv kiválasztása', question: 'Milyen nyelven beszélünk?' },
      name: { title: 'Preferált név', question: 'Hogyan szólítsam?', placeholder: 'Adja meg preferált nevét' },
      profession: {
        title: 'Szakmai DNS',
        question: 'Mi a foglalkozása?',
        manualEntry: 'Kézi bevitel',
        criticalArtifacts: 'Mint {profession}, melyek a "Kritikus alkotásai"?',
        addCustom: 'Egyéni hozzáadása',
        customProfession: 'Egyéni foglalkozás',
        customProfessionDesc: 'Adja meg a foglalkozás nevét',
        customArtifact: 'Egyéni alkotás',
        customArtifactDesc: 'Adja meg az alkotás nevét'
      },
      informationDiet: {
        title: 'Információs diéta',
        socialIntelligence: { question: 'Honnan szerzi a legjobb ötleteit?' },
        newsFocus: { question: 'Mely ágazatokat figyeljük Önnek?' },
        privacyBadge: 'Adatvédelem először'
      },
      essentials: {
        title: 'Alapadatok',
        gender: { question: 'Nem', male: 'Férfi', female: 'Nő', nonBinary: 'Nem bináris', preferNotToSay: 'Inkább nem mondom' },
        age: { question: 'Életkor', placeholder: 'Adja meg életkorát' },
        bloodGroup: { question: 'Vércsoport' },
        bodyType: { question: 'Testalkat', weight: 'Súly (kg)' },
        allergies: { question: 'Allergiák', addCustom: 'Egyéni allergia hozzáadása' },
        skinTone: { question: 'Bőrtónus' }
      },
      health: { title: 'Egészség motor', question: 'Hogyan optimalizáljuk a testét?' }
    },
    professions: { doctor: 'Orvos', nurse: 'Ápoló', pharmacist: 'Gyógyszerész', founder: 'Alapító', entrepreneur: 'Vállalkozó', retiring: 'Nyugdíjas', jobless: 'Munkanélküli', finance: 'Pénzügy', marketing: 'Marketing', whiteCollar: 'Irodai dolgozó', blueCollar: 'Fizikai dolgozó', mechanic: 'Szerelő' },
    languages: { en: 'Angol', es: 'Spanyol', fr: 'Francia', de: 'Német', ar: 'Arab', zh: 'Kínai', ja: 'Japán', hu: 'Magyar' }
  },
  uk: {
    onboarding: {
      welcome: 'Ласкаво просимо до Saydo',
      subtitle: 'Давайте налаштуємо вас',
      step: 'Крок',
      of: 'з',
      next: 'Далі',
      back: 'Назад',
      continue: 'Продовжити',
      skip: 'Пропустити',
      finish: 'Завершити'
    },
    steps: {
      language: { title: 'Вибір мови', question: 'Якою мовою ми говоримо?' },
      name: { title: 'Бажане ім\'я', question: 'Як мені вас називати?', placeholder: 'Введіть бажане ім\'я' },
      profession: {
        title: 'Професійна ДНК',
        question: 'Яка ваша професія?',
        manualEntry: 'Ручне введення',
        criticalArtifacts: 'Як {profession}, які ваші "Критичні артефакти"?',
        addCustom: 'Додати власний',
        customProfession: 'Власна професія',
        customProfessionDesc: 'Введіть назву професії',
        customArtifact: 'Власний артефакт',
        customArtifactDesc: 'Введіть назву артефакту'
      },
      informationDiet: {
        title: 'Інформаційна дієта',
        socialIntelligence: { question: 'Звідки ви отримуєте найкращі ідеї?' },
        newsFocus: { question: 'Які галузі мені відстежувати для вас?' },
        privacyBadge: 'Приватність насамперед'
      },
      essentials: {
        title: 'Основне',
        gender: { question: 'Стать', male: 'Чоловіча', female: 'Жіноча', nonBinary: 'Небінарна', preferNotToSay: 'Не хочу казати' },
        age: { question: 'Вік', placeholder: 'Введіть ваш вік' },
        bloodGroup: { question: 'Група крові' },
        bodyType: { question: 'Тип тіла', weight: 'Вага (кг)' },
        allergies: { question: 'Алергії', addCustom: 'Додати власну алергію' },
        skinTone: { question: 'Тон шкіри' }
      },
      health: { title: 'Двигун здоров\'я', question: 'Як ми оптимізуємо ваше тіло?' }
    },
    professions: { doctor: 'Лікар', nurse: 'Медсестра', pharmacist: 'Фармацевт', founder: 'Засновник', entrepreneur: 'Підприємець', retiring: 'На пенсії', jobless: 'Безробітний', finance: 'Фінанси', marketing: 'Маркетинг', whiteCollar: 'Офісний працівник', blueCollar: 'Робітник', mechanic: 'Механік' },
    languages: { en: 'Англійська', es: 'Іспанська', fr: 'Французька', de: 'Німецька', ar: 'Арабська', zh: 'Китайська', ja: 'Японська', uk: 'Українська' }
  },
  bg: {
    onboarding: {
      welcome: 'Добре дошли в Saydo',
      subtitle: 'Нека ви настроим',
      step: 'Стъпка',
      of: 'от',
      next: 'Напред',
      back: 'Назад',
      continue: 'Продължи',
      skip: 'Пропусни',
      finish: 'Завърши'
    },
    steps: {
      language: { title: 'Избор на език', question: 'На какъв език говорим?' },
      name: { title: 'Предпочитано име', question: 'Как да ви наричам?', placeholder: 'Въведете предпочитаното име' },
      profession: {
        title: 'Професионална ДНК',
        question: 'Каква е вашата професия?',
        manualEntry: 'Ръчно въвеждане',
        criticalArtifacts: 'Като {profession}, какви са вашите "Критични артефакти"?',
        addCustom: 'Добави персонализиран',
        customProfession: 'Персонализирана професия',
        customProfessionDesc: 'Въведете име на професия',
        customArtifact: 'Персонализиран артефакт',
        customArtifactDesc: 'Въведете име на артефакт'
      },
      informationDiet: {
        title: 'Информационна диета',
        socialIntelligence: { question: 'Откъде получавате най-добрите си идеи?' },
        newsFocus: { question: 'Кои сектори да следя за вас?' },
        privacyBadge: 'Поверителност на първо място'
      },
      essentials: {
        title: 'Основни данни',
        gender: { question: 'Пол', male: 'Мъж', female: 'Жена', nonBinary: 'Небинарен', preferNotToSay: 'Предпочитам да не казвам' },
        age: { question: 'Възраст', placeholder: 'Въведете възрастта си' },
        bloodGroup: { question: 'Кръвна група' },
        bodyType: { question: 'Тип тяло', weight: 'Тегло (кг)' },
        allergies: { question: 'Алергии', addCustom: 'Добави персонализирана алергия' },
        skinTone: { question: 'Тон на кожата' }
      },
      health: { title: 'Здравен двигател', question: 'Как оптимизираме тялото ви?' }
    },
    professions: { doctor: 'Лекар', nurse: 'Медицинска сестра', pharmacist: 'Фармацевт', founder: 'Основател', entrepreneur: 'Предприемач', retiring: 'Пенсиониран', jobless: 'Безработен', finance: 'Финанси', marketing: 'Маркетинг', whiteCollar: 'Служител', blueCollar: 'Работник', mechanic: 'Механик' },
    languages: { en: 'Английски', es: 'Испански', fr: 'Френски', de: 'Немски', ar: 'Арабски', zh: 'Китайски', ja: 'Японски', bg: 'Български' }
  },
  // African languages
  sw: {
    onboarding: {
      welcome: 'Karibu Saydo',
      subtitle: 'Hebu tuweke mipangilio yako',
      step: 'Hatua',
      of: 'ya',
      next: 'Inayofuata',
      back: 'Nyuma',
      continue: 'Endelea',
      skip: 'Ruka',
      finish: 'Maliza'
    },
    steps: {
      language: { title: 'Chagua Lugha', question: 'Tunazungumza lugha gani?' },
      name: { title: 'Jina Unalopendelea', question: 'Nikuiteje?', placeholder: 'Ingiza jina unalopendelea' },
      profession: {
        title: 'DNA ya Kitaaluma',
        question: 'Kazi yako ni ipi?',
        manualEntry: 'Ingiza Mwenyewe',
        criticalArtifacts: 'Kama {profession}, "Vifaa Muhimu" vyako ni vipi?',
        addCustom: 'Ongeza Maalum',
        customProfession: 'Kazi Maalum',
        customProfessionDesc: 'Ingiza jina la kazi',
        customArtifact: 'Kifaa Maalum',
        customArtifactDesc: 'Ingiza jina la kifaa'
      },
      informationDiet: {
        title: 'Lishe ya Habari',
        socialIntelligence: { question: 'Unapata mawazo bora wapi?' },
        newsFocus: { question: 'Sekta gani nifuatilie kwa ajili yako?' },
        privacyBadge: 'Faragha Kwanza'
      },
      essentials: {
        title: 'Mambo ya Msingi',
        gender: { question: 'Jinsia', male: 'Mwanaume', female: 'Mwanamke', nonBinary: 'Isiyo ya binary', preferNotToSay: 'Sipendelei kusema' },
        age: { question: 'Umri', placeholder: 'Ingiza umri wako' },
        bloodGroup: { question: 'Kundi la Damu' },
        bodyType: { question: 'Aina ya Mwili', weight: 'Uzito (kg)' },
        allergies: { question: 'Mizio', addCustom: 'Ongeza Mizio Maalum' },
        skinTone: { question: 'Rangi ya Ngozi' }
      },
      health: { title: 'Injini ya Afya', question: 'Tunaboresha mwili wako vipi?' }
    },
    professions: { doctor: 'Daktari', nurse: 'Muuguzi', pharmacist: 'Mfamasia', founder: 'Mwanzilishi', entrepreneur: 'Mjasiriamali', retiring: 'Mstaafu', jobless: 'Asiye na kazi', finance: 'Fedha', marketing: 'Masoko', whiteCollar: 'Mfanyakazi wa Ofisi', blueCollar: 'Mfanyakazi wa Mikono', mechanic: 'Fundi Mitambo' },
    languages: { en: 'Kiingereza', es: 'Kihispania', fr: 'Kifaransa', de: 'Kijerumani', ar: 'Kiarabu', zh: 'Kichina', ja: 'Kijapani', sw: 'Kiswahili' }
  },
  yo: {
    onboarding: {
      welcome: 'Ẹ káàbọ̀ sí Saydo',
      subtitle: 'Jẹ́ ká ṣètò yín',
      step: 'Ìgbésẹ̀',
      of: 'nínú',
      next: 'Tókàn',
      back: 'Padà',
      continue: 'Tesiwaju',
      skip: 'Fojú fo',
      finish: 'Parí'
    },
    steps: {
      language: { title: 'Yàn Èdè', question: 'Èdè wo la ń sọ?' },
      name: { title: 'Orúkọ Tí O Fẹ́ràn', question: 'Kí ni mo máa pè yín?', placeholder: 'Tẹ orúkọ tí o fẹ́ràn' },
      profession: {
        title: 'DNA Iṣẹ́',
        question: 'Kí ni iṣẹ́ rẹ?',
        manualEntry: 'Tẹ̀ Fúnrarẹ̀',
        criticalArtifacts: 'Gẹ́gẹ́ bíi {profession}, kí ni "Àwọn Ohun Pàtàkì" rẹ?',
        addCustom: 'Fi Àkànṣe Kún',
        customProfession: 'Iṣẹ́ Àkànṣe',
        customProfessionDesc: 'Tẹ orúkọ iṣẹ́',
        customArtifact: 'Ohun Àkànṣe',
        customArtifactDesc: 'Tẹ orúkọ ohun'
      },
      informationDiet: {
        title: 'Oúnjẹ Ìròyìn',
        socialIntelligence: { question: 'Níbo ni o ti ń gba àwọn èrò rẹ tó dára jùlọ?' },
        newsFocus: { question: 'Àwọn ẹ̀ka wo ni mo yẹ kí n ṣọ́ fún yín?' },
        privacyBadge: 'Àṣírí Ní Àkọ́kọ́'
      },
      essentials: {
        title: 'Àwọn Ohun Pàtàkì',
        gender: { question: 'Ìbálòpọ̀', male: 'Ọkùnrin', female: 'Obìnrin', nonBinary: 'Kò jẹ́ méjì', preferNotToSay: 'N kò fẹ́ sọ' },
        age: { question: 'Ọjọ́ Orí', placeholder: 'Tẹ ọjọ́ orí rẹ' },
        bloodGroup: { question: 'Ẹ̀yà Ẹ̀jẹ̀' },
        bodyType: { question: 'Irú Ara', weight: 'Ìwọ̀n (kg)' },
        allergies: { question: 'Àwọn Ohun Tí Ara Kò Gbà', addCustom: 'Fi Àkànṣe Kún' },
        skinTone: { question: 'Àwọ̀ Awọ' }
      },
      health: { title: 'Ẹ̀rọ Ìlera', question: 'Báwo ni a ṣe ń mú ara rẹ dára sí i?' }
    },
    professions: { doctor: 'Dókítà', nurse: 'Nọ́ọ̀sì', pharmacist: 'Oníṣègùn', founder: 'Olùdásílẹ̀', entrepreneur: 'Oníṣòwò', retiring: 'Tí ń fẹ̀yìn tì', jobless: 'Aláìníṣẹ́', finance: 'Iṣúná', marketing: 'Títà', whiteCollar: 'Òṣìṣẹ́ Ọ́fíìsì', blueCollar: 'Òṣìṣẹ́ Ọwọ́', mechanic: 'Mẹ́kánìkì' },
    languages: { en: 'Gẹ̀ẹ́sì', es: 'Sípáníìṣì', fr: 'Faransé', de: 'Jámánì', ar: 'Lárúbáwá', zh: 'Ṣáínà', ja: 'Jàpáànù', yo: 'Yorùbá' }
  },
  ig: {
    onboarding: {
      welcome: 'Nnọọ na Saydo',
      subtitle: 'Ka anyị hazie gị',
      step: 'Nzọụkwụ',
      of: 'n\'ime',
      next: 'Ọzọ',
      back: 'Azụ',
      continue: 'Gaa n\'ihu',
      skip: 'Wụfee',
      finish: 'Gwụcha'
    },
    steps: {
      language: { title: 'Họrọ Asụsụ', question: 'Asụsụ gịnị ka anyị na-asụ?' },
      name: { title: 'Aha Ị Masịrị', question: 'Gịnị ka m ga-akpọ gị?', placeholder: 'Tinye aha ị masịrị' },
      profession: {
        title: 'DNA Ọrụ',
        question: 'Gịnị bụ ọrụ gị?',
        manualEntry: 'Ntinye Aka',
        criticalArtifacts: 'Dị ka {profession}, gịnị bụ "Ihe Dị Mkpa" gị?',
        addCustom: 'Tinye Nke Onwe Gị',
        customProfession: 'Ọrụ Onwe Gị',
        customProfessionDesc: 'Tinye aha ọrụ',
        customArtifact: 'Ihe Onwe Gị',
        customArtifactDesc: 'Tinye aha ihe'
      },
      informationDiet: {
        title: 'Nri Ozi',
        socialIntelligence: { question: 'Ebee ka ị na-enweta echiche kacha mma?' },
        newsFocus: { question: 'Ngalaba ole ka m ga-elekọta maka gị?' },
        privacyBadge: 'Nzuzo Bụ Isi'
      },
      essentials: {
        title: 'Ihe Ndị Dị Mkpa',
        gender: { question: 'Okike', male: 'Nwoke', female: 'Nwanyị', nonBinary: 'Ọ bụghị abụọ', preferNotToSay: 'Achọghị m ịkọ' },
        age: { question: 'Afọ', placeholder: 'Tinye afọ gị' },
        bloodGroup: { question: 'Ụdị Ọbara' },
        bodyType: { question: 'Ụdị Ahụ', weight: 'Ibu (kg)' },
        allergies: { question: 'Ihe Anaghị Adị Mma', addCustom: 'Tinye Nke Onwe Gị' },
        skinTone: { question: 'Agba Akpụkpọ Ahụ' }
      },
      health: { title: 'Njikwa Ahụ Ike', question: 'Kedu ka anyị ga-esi melite ahụ gị?' }
    },
    professions: { doctor: 'Dọkịta', nurse: 'Nọọsụ', pharmacist: 'Onye na-ere ọgwụ', founder: 'Onye Hibere', entrepreneur: 'Onye Ahịa', retiring: 'Ezumike', jobless: 'Enweghị Ọrụ', finance: 'Ego', marketing: 'Ahịa', whiteCollar: 'Onye Ọrụ Ọfịs', blueCollar: 'Onye Ọrụ Aka', mechanic: 'Ọkwụ Ụgbọ' },
    languages: { en: 'Bekee', es: 'Spanish', fr: 'French', de: 'German', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ig: 'Igbo' }
  },
  ha: {
    onboarding: {
      welcome: 'Barka da zuwa Saydo',
      subtitle: 'Bari mu saita ka',
      step: 'Mataki',
      of: 'na',
      next: 'Na gaba',
      back: 'Baya',
      continue: 'Ci gaba',
      skip: 'Tsallake',
      finish: 'Kammala'
    },
    steps: {
      language: { title: 'Zaɓin Harshe', question: 'Wane harshe muke magana?' },
      name: { title: 'Sunan da Kake So', question: 'Me zan kira ka?', placeholder: 'Shigar da sunan da kake so' },
      profession: {
        title: 'DNA na Sana\'a',
        question: 'Mene ne sana\'ar ka?',
        manualEntry: 'Shigarwa ta Hannu',
        criticalArtifacts: 'A matsayin {profession}, mene ne "Muhimman Abubuwa" naka?',
        addCustom: 'Ƙara Na Musamman',
        customProfession: 'Sana\'a Na Musamman',
        customProfessionDesc: 'Shigar da sunan sana\'a',
        customArtifact: 'Abu Na Musamman',
        customArtifactDesc: 'Shigar da sunan abu'
      },
      informationDiet: {
        title: 'Abincin Bayanai',
        socialIntelligence: { question: 'Ina kuke samun ra\'ayoyin ku mafi kyau?' },
        newsFocus: { question: 'Wane sashe zan lura muku?' },
        privacyBadge: 'Sirri Da Farko'
      },
      essentials: {
        title: 'Muhimman Bayanai',
        gender: { question: 'Jinsi', male: 'Namiji', female: 'Mace', nonBinary: 'Ba binary ba', preferNotToSay: 'Ban so in faɗa ba' },
        age: { question: 'Shekaru', placeholder: 'Shigar da shekarun ka' },
        bloodGroup: { question: 'Ƙungiyar Jini' },
        bodyType: { question: 'Nau\'in Jiki', weight: 'Nauyi (kg)' },
        allergies: { question: 'Allergies', addCustom: 'Ƙara Na Musamman' },
        skinTone: { question: 'Launin Fata' }
      },
      health: { title: 'Injin Lafiya', question: 'Ta yaya za mu inganta jikin ka?' }
    },
    professions: { doctor: 'Likita', nurse: 'Ma\'aikaciyar Jinya', pharmacist: 'Mai Sayar da Magani', founder: 'Wanda Ya Kafa', entrepreneur: 'Ɗan Kasuwa', retiring: 'Mai Ritaya', jobless: 'Marar Aiki', finance: 'Kuɗi', marketing: 'Tallace-tallace', whiteCollar: 'Ma\'aikacin Ofis', blueCollar: 'Ma\'aikacin Hannu', mechanic: 'Makanikin' },
    languages: { en: 'Turanci', es: 'Sipanish', fr: 'Faransanci', de: 'Jamusanci', ar: 'Larabci', zh: 'Sinanci', ja: 'Japananci', ha: 'Hausa' }
  },
  rw: {
    onboarding: {
      welcome: 'Murakaza neza kuri Saydo',
      subtitle: 'Reka tukubone',
      step: 'Intambwe',
      of: 'muri',
      next: 'Ibikurikira',
      back: 'Inyuma',
      continue: 'Komeza',
      skip: 'Simbuka',
      finish: 'Rangiza'
    },
    steps: {
      language: { title: 'Guhitamo Ururimi', question: 'Tuvuga ururimi ruhe?' },
      name: { title: 'Izina Ukunda', question: 'Nkwite nde?', placeholder: 'Andika izina ukunda' },
      profession: {
        title: 'DNA y\'Umwuga',
        question: 'Umwuga wawe ni uwuhe?',
        manualEntry: 'Kwandika',
        criticalArtifacts: 'Nka {profession}, ni ibihe "Ibintu Byingenzi"?',
        addCustom: 'Ongeraho Ibisanzwe',
        customProfession: 'Umwuga Wihariye',
        customProfessionDesc: 'Andika izina ry\'umwuga',
        customArtifact: 'Ikintu Cyihariye',
        customArtifactDesc: 'Andika izina ry\'ikintu'
      },
      informationDiet: {
        title: 'Ibiryo by\'Amakuru',
        socialIntelligence: { question: 'Ni hehe ubona ibitekerezo byiza?' },
        newsFocus: { question: 'Ni ibihe bicuruzwa nkurikirana?' },
        privacyBadge: 'Ubuzima Bwite Mbere'
      },
      essentials: {
        title: 'Iby\'ingenzi',
        gender: { question: 'Igitsina', male: 'Gabo', female: 'Gore', nonBinary: 'Ntabwo ari bibiri', preferNotToSay: 'Sinshaka kuvuga' },
        age: { question: 'Imyaka', placeholder: 'Andika imyaka yawe' },
        bloodGroup: { question: 'Itsinda ry\'Amaraso' },
        bodyType: { question: 'Ubwoko bw\'Umubiri', weight: 'Ibiro (kg)' },
        allergies: { question: 'Allergies', addCustom: 'Ongeraho Ibihariye' },
        skinTone: { question: 'Ibara ry\'Uruhu' }
      },
      health: { title: 'Injini y\'Ubuzima', question: 'Tubigenza dute kugira ngo umubiri wawe ukore neza?' }
    },
    professions: { doctor: 'Muganga', nurse: 'Umuforomo', pharmacist: 'Umunyafaramasiya', founder: 'Umushinze', entrepreneur: 'Umucuruzi', retiring: 'Uwasezereye', jobless: 'Nta kazi', finance: 'Imari', marketing: 'Kwamamaza', whiteCollar: 'Umukozi w\'Ibiro', blueCollar: 'Umukozi w\'Intoki', mechanic: 'Mekaniki' },
    languages: { en: 'Icyongereza', es: 'Icyesipanyoli', fr: 'Igifaransa', de: 'Ikidage', ar: 'Icyarabu', zh: 'Igishinwa', ja: 'Ikiyapani', rw: 'Ikinyarwanda' }
  },
  zu: {
    onboarding: {
      welcome: 'Siyakwamukela ku-Saydo',
      subtitle: 'Ake sikumise',
      step: 'Isinyathelo',
      of: 'kwayi',
      next: 'Okulandelayo',
      back: 'Emuva',
      continue: 'Qhubeka',
      skip: 'Yeqa',
      finish: 'Qeda'
    },
    steps: {
      language: { title: 'Ukhethe Ulimi', question: 'Sikhuluma luluphi ulimi?' },
      name: { title: 'Igama Olithanda', question: 'Ngikubize ngithini?', placeholder: 'Faka igama olithanda' },
      profession: {
        title: 'DNA Yomsebenzi',
        question: 'Yimuphi umsebenzi wakho?',
        manualEntry: 'Ukufaka Ngesandla',
        criticalArtifacts: 'Njengomuntu oyi-{profession}, yini "Izinto Ezibalulekile" zakho?',
        addCustom: 'Faka Okwakho',
        customProfession: 'Umsebenzi Wakho',
        customProfessionDesc: 'Faka igama lomsebenzi',
        customArtifact: 'Into Yakho',
        customArtifactDesc: 'Faka igama lento'
      },
      informationDiet: {
        title: 'Ukudla Kolwazi',
        socialIntelligence: { question: 'Uthola kuphi imibono yakho engcono kakhulu?' },
        newsFocus: { question: 'Yiziphi izimboni okufanele ngizibheke?' },
        privacyBadge: 'Ubumfihlo Kuqala'
      },
      essentials: {
        title: 'Izinto Ezibalulekile',
        gender: { question: 'Ubulili', male: 'Owesilisa', female: 'Owesifazane', nonBinary: 'Akubili', preferNotToSay: 'Angithandi ukusho' },
        age: { question: 'Iminyaka', placeholder: 'Faka iminyaka yakho' },
        bloodGroup: { question: 'Iqembu Legazi' },
        bodyType: { question: 'Uhlobo Lomzimba', weight: 'Isisindo (kg)' },
        allergies: { question: 'Ama-allergy', addCustom: 'Faka Okwakho' },
        skinTone: { question: 'Umbala Wesikhumba' }
      },
      health: { title: 'Injini Yempilo', question: 'Siwuthuthukisa kanjani umzimba wakho?' }
    },
    professions: { doctor: 'Udokotela', nurse: 'Umhlengikazi', pharmacist: 'Umkhemisi', founder: 'Umsunguli', entrepreneur: 'Usomabhizinisi', retiring: 'Othathe umhlalaphansi', jobless: 'Ongasebenzi', finance: 'Ezezimali', marketing: 'Ukumaketha', whiteCollar: 'Isisebenzi Sase-ofisi', blueCollar: 'Isisebenzi Esisebenza Ngezandla', mechanic: 'Umakhenikha' },
    languages: { en: 'IsiNgisi', es: 'IsiSpanishi', fr: 'IsiFulentshi', de: 'IsiJalimane', ar: 'Isi-Arabhu', zh: 'IsiShayina', ja: 'IsiJapani', zu: 'IsiZulu' }
  },
  am: {
    onboarding: {
      welcome: 'ወደ Saydo እንኳን በደህና መጡ',
      subtitle: 'እንዘጋጅ',
      step: 'ደረጃ',
      of: 'ከ',
      next: 'ቀጣይ',
      back: 'ተመለስ',
      continue: 'ቀጥል',
      skip: 'ዝለል',
      finish: 'ጨርስ'
    },
    steps: {
      language: { title: 'ቋንቋ ምረጥ', question: 'በየትኛው ቋንቋ እንናገራለን?' },
      name: { title: 'የሚመርጡት ስም', question: 'ምን ልላችሁ?', placeholder: 'የሚመርጡትን ስም ያስገቡ' },
      profession: {
        title: 'ሙያዊ DNA',
        question: 'ሙያዎ ምንድን ነው?',
        manualEntry: 'በእጅ ማስገባት',
        criticalArtifacts: 'እንደ {profession}፣ "ወሳኝ ቁሳቁሶችዎ" ምንድን ናቸው?',
        addCustom: 'ብጁ ያክሉ',
        customProfession: 'ብጁ ሙያ',
        customProfessionDesc: 'የሙያ ስም ያስገቡ',
        customArtifact: 'ብጁ ቁሳቁስ',
        customArtifactDesc: 'የቁሳቁስ ስም ያስገቡ'
      },
      informationDiet: {
        title: 'የመረጃ ምግብ',
        socialIntelligence: { question: 'ምርጥ ሀሳቦችዎን ከየት ያገኛሉ?' },
        newsFocus: { question: 'የትኞቹን ዘርፎች ልከታተል?' },
        privacyBadge: 'ግላዊነት በቅድሚያ'
      },
      essentials: {
        title: 'መሰረታዊ',
        gender: { question: 'ጾታ', male: 'ወንድ', female: 'ሴት', nonBinary: 'ሁለቱም አይደለም', preferNotToSay: 'ማለት አልመርጥም' },
        age: { question: 'ዕድሜ', placeholder: 'ዕድሜዎን ያስገቡ' },
        bloodGroup: { question: 'የደም ቡድን' },
        bodyType: { question: 'የሰውነት አይነት', weight: 'ክብደት (ኪ.ግ)' },
        allergies: { question: 'አለርጂዎች', addCustom: 'ብጁ አለርጂ ያክሉ' },
        skinTone: { question: 'የቆዳ ቀለም' }
      },
      health: { title: 'የጤና ሞተር', question: 'ሰውነትዎን እንዴት እናሻሽላለን?' }
    },
    professions: { doctor: 'ሐኪም', nurse: 'ነርስ', pharmacist: 'ፋርማሲስት', founder: 'መስራች', entrepreneur: 'ስራ ፈጣሪ', retiring: 'ጡረተኛ', jobless: 'ስራ አጥ', finance: 'ፋይናንስ', marketing: 'ግብይት', whiteCollar: 'የቢሮ ሰራተኛ', blueCollar: 'የእጅ ሰራተኛ', mechanic: 'መካኒክ' },
    languages: { en: 'እንግሊዝኛ', es: 'ስፓኒሽ', fr: 'ፈረንሳይኛ', de: 'ጀርመንኛ', ar: 'አረብኛ', zh: 'ቻይንኛ', ja: 'ጃፓንኛ', am: 'አማርኛ' }
  },
  // Asian dialects
  tl: {
    onboarding: {
      welcome: 'Maligayang pagdating sa Saydo',
      subtitle: 'I-setup natin ang iyong profile',
      step: 'Hakbang',
      of: 'ng',
      next: 'Susunod',
      back: 'Bumalik',
      continue: 'Magpatuloy',
      skip: 'Laktawan',
      finish: 'Tapusin'
    },
    steps: {
      language: { title: 'Pagpili ng Wika', question: 'Anong wika ang gagamitin natin?' },
      name: { title: 'Gustong Pangalan', question: 'Ano ang itatawag ko sa iyo?', placeholder: 'Ilagay ang gustong pangalan' },
      profession: {
        title: 'Professional DNA',
        question: 'Ano ang iyong propesyon?',
        manualEntry: 'Manual na Paglagay',
        criticalArtifacts: 'Bilang {profession}, ano ang iyong mga "Mahahalagang Artifact"?',
        addCustom: 'Magdagdag ng Custom',
        customProfession: 'Custom na Propesyon',
        customProfessionDesc: 'Ilagay ang pangalan ng propesyon',
        customArtifact: 'Custom na Artifact',
        customArtifactDesc: 'Ilagay ang pangalan ng artifact'
      },
      informationDiet: {
        title: 'Information Diet',
        socialIntelligence: { question: 'Saan mo nakukuha ang pinakamahusay mong mga ideya?' },
        newsFocus: { question: 'Anong mga industriya ang dapat kong bantayan para sa iyo?' },
        privacyBadge: 'Privacy Muna'
      },
      essentials: {
        title: 'Mga Pangunahing Impormasyon',
        gender: { question: 'Kasarian', male: 'Lalaki', female: 'Babae', nonBinary: 'Non-binary', preferNotToSay: 'Ayaw kong sabihin' },
        age: { question: 'Edad', placeholder: 'Ilagay ang iyong edad' },
        bloodGroup: { question: 'Uri ng Dugo' },
        bodyType: { question: 'Uri ng Katawan', weight: 'Timbang (kg)' },
        allergies: { question: 'Mga Allergy', addCustom: 'Magdagdag ng Custom na Allergy' },
        skinTone: { question: 'Kulay ng Balat' }
      },
      health: { title: 'Health Engine', question: 'Paano natin i-optimize ang iyong katawan?' }
    },
    professions: { doctor: 'Doktor', nurse: 'Nars', pharmacist: 'Parmaseutiko', founder: 'Tagapagtatag', entrepreneur: 'Negosyante', retiring: 'Retirado', jobless: 'Walang Trabaho', finance: 'Pinansya', marketing: 'Marketing', whiteCollar: 'Empleyado sa Opisina', blueCollar: 'Manggagawa', mechanic: 'Mekaniko' },
    languages: { en: 'Ingles', es: 'Espanyol', fr: 'Pranses', de: 'Aleman', ar: 'Arabo', zh: 'Tsino', ja: 'Hapon', tl: 'Tagalog' }
  },
  ms: {
    onboarding: {
      welcome: 'Selamat datang ke Saydo',
      subtitle: 'Mari kita sediakan anda',
      step: 'Langkah',
      of: 'daripada',
      next: 'Seterusnya',
      back: 'Kembali',
      continue: 'Teruskan',
      skip: 'Langkau',
      finish: 'Selesai'
    },
    steps: {
      language: { title: 'Pilihan Bahasa', question: 'Bahasa apa yang kita gunakan?' },
      name: { title: 'Nama Pilihan', question: 'Apa panggilan untuk anda?', placeholder: 'Masukkan nama pilihan anda' },
      profession: {
        title: 'DNA Profesional',
        question: 'Apakah profesion anda?',
        manualEntry: 'Kemasukan Manual',
        criticalArtifacts: 'Sebagai {profession}, apakah "Artifak Kritikal" anda?',
        addCustom: 'Tambah Tersuai',
        customProfession: 'Profesion Tersuai',
        customProfessionDesc: 'Masukkan nama profesion',
        customArtifact: 'Artifak Tersuai',
        customArtifactDesc: 'Masukkan nama artifak'
      },
      informationDiet: {
        title: 'Diet Maklumat',
        socialIntelligence: { question: 'Di mana anda mendapat idea terbaik?' },
        newsFocus: { question: 'Industri mana yang perlu saya pantau untuk anda?' },
        privacyBadge: 'Privasi Utama'
      },
      essentials: {
        title: 'Perkara Asas',
        gender: { question: 'Jantina', male: 'Lelaki', female: 'Perempuan', nonBinary: 'Bukan binari', preferNotToSay: 'Tidak mahu menyatakan' },
        age: { question: 'Umur', placeholder: 'Masukkan umur anda' },
        bloodGroup: { question: 'Kumpulan Darah' },
        bodyType: { question: 'Jenis Badan', weight: 'Berat (kg)' },
        allergies: { question: 'Alahan', addCustom: 'Tambah Alahan Tersuai' },
        skinTone: { question: 'Warna Kulit' }
      },
      health: { title: 'Enjin Kesihatan', question: 'Bagaimana kami mengoptimumkan badan anda?' }
    },
    professions: { doctor: 'Doktor', nurse: 'Jururawat', pharmacist: 'Ahli Farmasi', founder: 'Pengasas', entrepreneur: 'Usahawan', retiring: 'Bersara', jobless: 'Menganggur', finance: 'Kewangan', marketing: 'Pemasaran', whiteCollar: 'Pekerja Pejabat', blueCollar: 'Pekerja Buruh', mechanic: 'Mekanik' },
    languages: { en: 'Inggeris', es: 'Sepanyol', fr: 'Perancis', de: 'Jerman', ar: 'Arab', zh: 'Cina', ja: 'Jepun', ms: 'Melayu' }
  },
  bn: {
    onboarding: {
      welcome: 'Saydo-তে স্বাগতম',
      subtitle: 'আসুন আপনাকে সেট আপ করি',
      step: 'ধাপ',
      of: 'এর',
      next: 'পরবর্তী',
      back: 'পেছনে',
      continue: 'চালিয়ে যান',
      skip: 'এড়িয়ে যান',
      finish: 'শেষ করুন'
    },
    steps: {
      language: { title: 'ভাষা নির্বাচন', question: 'আমরা কোন ভাষায় কথা বলি?' },
      name: { title: 'পছন্দের নাম', question: 'আপনাকে কী বলব?', placeholder: 'আপনার পছন্দের নাম লিখুন' },
      profession: {
        title: 'পেশাদার DNA',
        question: 'আপনার পেশা কী?',
        manualEntry: 'ম্যানুয়াল এন্ট্রি',
        criticalArtifacts: 'একজন {profession} হিসাবে, আপনার "গুরুত্বপূর্ণ আর্টিফ্যাক্ট" কী?',
        addCustom: 'কাস্টম যোগ করুন',
        customProfession: 'কাস্টম পেশা',
        customProfessionDesc: 'পেশার নাম লিখুন',
        customArtifact: 'কাস্টম আর্টিফ্যাক্ট',
        customArtifactDesc: 'আর্টিফ্যাক্টের নাম লিখুন'
      },
      informationDiet: {
        title: 'তথ্য ডায়েট',
        socialIntelligence: { question: 'আপনি আপনার সেরা ধারণা কোথা থেকে পান?' },
        newsFocus: { question: 'আপনার জন্য কোন সেক্টর মনিটর করব?' },
        privacyBadge: 'গোপনীয়তা প্রথম'
      },
      essentials: {
        title: 'প্রয়োজনীয় তথ্য',
        gender: { question: 'লিঙ্গ', male: 'পুরুষ', female: 'মহিলা', nonBinary: 'নন-বাইনারি', preferNotToSay: 'বলতে চাই না' },
        age: { question: 'বয়স', placeholder: 'আপনার বয়স লিখুন' },
        bloodGroup: { question: 'রক্তের গ্রুপ' },
        bodyType: { question: 'শরীরের ধরন', weight: 'ওজন (কেজি)' },
        allergies: { question: 'অ্যালার্জি', addCustom: 'কাস্টম অ্যালার্জি যোগ করুন' },
        skinTone: { question: 'ত্বকের রঙ' }
      },
      health: { title: 'স্বাস্থ্য ইঞ্জিন', question: 'আমরা কীভাবে আপনার শরীর অপ্টিমাইজ করছি?' }
    },
    professions: { doctor: 'ডাক্তার', nurse: 'নার্স', pharmacist: 'ফার্মাসিস্ট', founder: 'প্রতিষ্ঠাতা', entrepreneur: 'উদ্যোক্তা', retiring: 'অবসরপ্রাপ্ত', jobless: 'বেকার', finance: 'ফাইন্যান্স', marketing: 'মার্কেটিং', whiteCollar: 'অফিস কর্মী', blueCollar: 'শ্রমিক', mechanic: 'মেকানিক' },
    languages: { en: 'ইংরেজি', es: 'স্প্যানিশ', fr: 'ফরাসি', de: 'জার্মান', ar: 'আরবি', zh: 'চীনা', ja: 'জাপানি', bn: 'বাংলা' }
  },
  ta: {
    onboarding: {
      welcome: 'Saydo-க்கு வரவேற்கிறோம்',
      subtitle: 'உங்களை அமைப்போம்',
      step: 'படி',
      of: 'இல்',
      next: 'அடுத்து',
      back: 'பின்னால்',
      continue: 'தொடர்க',
      skip: 'தவிர்',
      finish: 'முடி'
    },
    steps: {
      language: { title: 'மொழி தேர்வு', question: 'நாம் எந்த மொழியில் பேசுகிறோம்?' },
      name: { title: 'விரும்பிய பெயர்', question: 'உங்களை என்னவென்று அழைப்பது?', placeholder: 'உங்கள் விரும்பிய பெயரை உள்ளிடவும்' },
      profession: {
        title: 'தொழில்முறை DNA',
        question: 'உங்கள் தொழில் என்ன?',
        manualEntry: 'கைமுறை உள்ளீடு',
        criticalArtifacts: 'ஒரு {profession} என்ற முறையில், உங்கள் "முக்கிய கலைப்பொருட்கள்" என்ன?',
        addCustom: 'தனிப்பயன் சேர்',
        customProfession: 'தனிப்பயன் தொழில்',
        customProfessionDesc: 'தொழில் பெயரை உள்ளிடவும்',
        customArtifact: 'தனிப்பயன் கலைப்பொருள்',
        customArtifactDesc: 'கலைப்பொருள் பெயரை உள்ளிடவும்'
      },
      informationDiet: {
        title: 'தகவல் உணவு',
        socialIntelligence: { question: 'உங்கள் சிறந்த யோசனைகளை எங்கிருந்து பெறுகிறீர்கள்?' },
        newsFocus: { question: 'உங்களுக்காக எந்த துறைகளை கண்காணிக்க வேண்டும்?' },
        privacyBadge: 'தனியுரிமை முதலில்'
      },
      essentials: {
        title: 'அடிப்படைகள்',
        gender: { question: 'பாலினம்', male: 'ஆண்', female: 'பெண்', nonBinary: 'இருபாலிலி அல்லாத', preferNotToSay: 'சொல்ல விரும்பவில்லை' },
        age: { question: 'வயது', placeholder: 'உங்கள் வயதை உள்ளிடவும்' },
        bloodGroup: { question: 'இரத்த வகை' },
        bodyType: { question: 'உடல் வகை', weight: 'எடை (கிலோ)' },
        allergies: { question: 'ஒவ்வாமைகள்', addCustom: 'தனிப்பயன் ஒவ்வாமை சேர்' },
        skinTone: { question: 'தோல் நிறம்' }
      },
      health: { title: 'சுகாதார இயந்திரம்', question: 'உங்கள் உடலை எப்படி மேம்படுத்துகிறோம்?' }
    },
    professions: { doctor: 'மருத்துவர்', nurse: 'செவிலியர்', pharmacist: 'மருந்தாளர்', founder: 'நிறுவனர்', entrepreneur: 'தொழிலதிபர்', retiring: 'ஓய்வு', jobless: 'வேலையில்லாத', finance: 'நிதி', marketing: 'சந்தைப்படுத்தல்', whiteCollar: 'அலுவலக ஊழியர்', blueCollar: 'தொழிலாளி', mechanic: 'மெக்கானிக்' },
    languages: { en: 'ஆங்கிலம்', es: 'ஸ்பானிஷ்', fr: 'பிரெஞ்சு', de: 'ஜெர்மன்', ar: 'அரபு', zh: 'சீனம்', ja: 'ஜப்பானிய', ta: 'தமிழ்' }
  },
  te: {
    onboarding: {
      welcome: 'Saydo కి స్వాగతం',
      subtitle: 'మిమ్మల్ని సెటప్ చేద్దాం',
      step: 'దశ',
      of: 'లో',
      next: 'తదుపరి',
      back: 'వెనక్కి',
      continue: 'కొనసాగించు',
      skip: 'దాటవేయి',
      finish: 'ముగించు'
    },
    steps: {
      language: { title: 'భాష ఎంపిక', question: 'మనం ఏ భాషలో మాట్లాడతాం?' },
      name: { title: 'ఇష్టమైన పేరు', question: 'మిమ్మల్ని ఏమని పిలవాలి?', placeholder: 'మీ ఇష్టమైన పేరు నమోదు చేయండి' },
      profession: {
        title: 'వృత్తిపరమైన DNA',
        question: 'మీ వృత్తి ఏమిటి?',
        manualEntry: 'మాన్యువల్ ఎంట్రీ',
        criticalArtifacts: 'ఒక {profession} గా, మీ "క్లిష్టమైన ఆర్టిఫ్యాక్ట్స్" ఏమిటి?',
        addCustom: 'కస్టమ్ జోడించు',
        customProfession: 'కస్టమ్ వృత్తి',
        customProfessionDesc: 'వృత్తి పేరు నమోదు చేయండి',
        customArtifact: 'కస్టమ్ ఆర్టిఫ్యాక్ట్',
        customArtifactDesc: 'ఆర్టిఫ్యాక్ట్ పేరు నమోదు చేయండి'
      },
      informationDiet: {
        title: 'సమాచార ఆహారం',
        socialIntelligence: { question: 'మీరు మీ ఉత్తమ ఆలోచనలను ఎక్కడ నుండి పొందుతారు?' },
        newsFocus: { question: 'మీ కోసం ఏ రంగాలను పర్యవేక్షించాలి?' },
        privacyBadge: 'గోప్యత ముందుగా'
      },
      essentials: {
        title: 'అవసరమైనవి',
        gender: { question: 'లింగం', male: 'పురుషుడు', female: 'స్త్రీ', nonBinary: 'నాన్-బైనరీ', preferNotToSay: 'చెప్పడం ఇష్టం లేదు' },
        age: { question: 'వయస్సు', placeholder: 'మీ వయస్సు నమోదు చేయండి' },
        bloodGroup: { question: 'రక్త సమూహం' },
        bodyType: { question: 'శరీర రకం', weight: 'బరువు (కేజీ)' },
        allergies: { question: 'అలర్జీలు', addCustom: 'కస్టమ్ అలర్జీ జోడించు' },
        skinTone: { question: 'చర్మ రంగు' }
      },
      health: { title: 'ఆరోగ్య ఇంజిన్', question: 'మీ శరీరాన్ని ఎలా ఆప్టిమైజ్ చేస్తున్నాము?' }
    },
    professions: { doctor: 'డాక్టర్', nurse: 'నర్సు', pharmacist: 'ఫార్మసిస్ట్', founder: 'వ్యవస్థాపకుడు', entrepreneur: 'వ్యాపారవేత్త', retiring: 'రిటైర్', jobless: 'నిరుద్యోగి', finance: 'ఫైనాన్స్', marketing: 'మార్కెటింగ్', whiteCollar: 'కార్యాలయ ఉద్యోగి', blueCollar: 'శ్రామికుడు', mechanic: 'మెకానిక్' },
    languages: { en: 'ఆంగ్లం', es: 'స్పానిష్', fr: 'ఫ్రెంచ్', de: 'జర్మన్', ar: 'అరబిక్', zh: 'చైనీస్', ja: 'జపనీస్', te: 'తెలుగు' }
  },
  ur: {
    onboarding: {
      welcome: 'Saydo میں خوش آمدید',
      subtitle: 'آئیے آپ کو سیٹ اپ کریں',
      step: 'قدم',
      of: 'میں سے',
      next: 'اگلا',
      back: 'واپس',
      continue: 'جاری رکھیں',
      skip: 'چھوڑیں',
      finish: 'ختم کریں'
    },
    steps: {
      language: { title: 'زبان کا انتخاب', question: 'ہم کس زبان میں بات کریں گے؟' },
      name: { title: 'پسندیدہ نام', question: 'میں آپ کو کیا پکاروں؟', placeholder: 'اپنا پسندیدہ نام درج کریں' },
      profession: {
        title: 'پیشہ ورانہ DNA',
        question: 'آپ کا پیشہ کیا ہے؟',
        manualEntry: 'دستی اندراج',
        criticalArtifacts: 'بطور {profession}، آپ کے "اہم آرٹیفیکٹس" کیا ہیں؟',
        addCustom: 'اپنا شامل کریں',
        customProfession: 'اپنا پیشہ',
        customProfessionDesc: 'پیشے کا نام درج کریں',
        customArtifact: 'اپنا آرٹیفیکٹ',
        customArtifactDesc: 'آرٹیفیکٹ کا نام درج کریں'
      },
      informationDiet: {
        title: 'معلوماتی خوراک',
        socialIntelligence: { question: 'آپ اپنے بہترین خیالات کہاں سے حاصل کرتے ہیں؟' },
        newsFocus: { question: 'آپ کے لیے کون سے شعبے نگرانی کروں؟' },
        privacyBadge: 'رازداری پہلے'
      },
      essentials: {
        title: 'ضروری معلومات',
        gender: { question: 'جنس', male: 'مرد', female: 'عورت', nonBinary: 'نان بائنری', preferNotToSay: 'بتانا نہیں چاہتا' },
        age: { question: 'عمر', placeholder: 'اپنی عمر درج کریں' },
        bloodGroup: { question: 'خون کا گروپ' },
        bodyType: { question: 'جسمانی ساخت', weight: 'وزن (کلوگرام)' },
        allergies: { question: 'الرجیاں', addCustom: 'اپنی الرجی شامل کریں' },
        skinTone: { question: 'جلد کا رنگ' }
      },
      health: { title: 'صحت کا انجن', question: 'ہم آپ کے جسم کو کیسے بہتر بنا رہے ہیں؟' }
    },
    professions: { doctor: 'ڈاکٹر', nurse: 'نرس', pharmacist: 'فارماسسٹ', founder: 'بانی', entrepreneur: 'کاروباری', retiring: 'ریٹائرڈ', jobless: 'بے روزگار', finance: 'مالیات', marketing: 'مارکیٹنگ', whiteCollar: 'دفتری ملازم', blueCollar: 'مزدور', mechanic: 'مکینک' },
    languages: { en: 'انگریزی', es: 'ہسپانوی', fr: 'فرانسیسی', de: 'جرمن', ar: 'عربی', zh: 'چینی', ja: 'جاپانی', ur: 'اردو' }
  },
  pa: {
    onboarding: {
      welcome: 'Saydo ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ',
      subtitle: 'ਆਓ ਤੁਹਾਨੂੰ ਸੈੱਟਅੱਪ ਕਰੀਏ',
      step: 'ਕਦਮ',
      of: 'ਵਿੱਚੋਂ',
      next: 'ਅਗਲਾ',
      back: 'ਪਿੱਛੇ',
      continue: 'ਜਾਰੀ ਰੱਖੋ',
      skip: 'ਛੱਡੋ',
      finish: 'ਮੁਕੰਮਲ'
    },
    steps: {
      language: { title: 'ਭਾਸ਼ਾ ਚੋਣ', question: 'ਅਸੀਂ ਕਿਹੜੀ ਭਾਸ਼ਾ ਬੋਲੀਏ?' },
      name: { title: 'ਪਸੰਦੀਦਾ ਨਾਮ', question: 'ਮੈਂ ਤੁਹਾਨੂੰ ਕੀ ਕਹਾਂ?', placeholder: 'ਆਪਣਾ ਪਸੰਦੀਦਾ ਨਾਮ ਦਰਜ ਕਰੋ' },
      profession: {
        title: 'ਪੇਸ਼ੇਵਰ DNA',
        question: 'ਤੁਹਾਡਾ ਪੇਸ਼ਾ ਕੀ ਹੈ?',
        manualEntry: 'ਦਸਤੀ ਐਂਟਰੀ',
        criticalArtifacts: '{profession} ਵਜੋਂ, ਤੁਹਾਡੇ "ਮਹੱਤਵਪੂਰਨ ਆਰਟੀਫੈਕਟ" ਕੀ ਹਨ?',
        addCustom: 'ਕਸਟਮ ਸ਼ਾਮਲ ਕਰੋ',
        customProfession: 'ਕਸਟਮ ਪੇਸ਼ਾ',
        customProfessionDesc: 'ਪੇਸ਼ੇ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ',
        customArtifact: 'ਕਸਟਮ ਆਰਟੀਫੈਕਟ',
        customArtifactDesc: 'ਆਰਟੀਫੈਕਟ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ'
      },
      informationDiet: {
        title: 'ਜਾਣਕਾਰੀ ਖੁਰਾਕ',
        socialIntelligence: { question: 'ਤੁਸੀਂ ਆਪਣੇ ਸਭ ਤੋਂ ਵਧੀਆ ਵਿਚਾਰ ਕਿੱਥੋਂ ਪ੍ਰਾਪਤ ਕਰਦੇ ਹੋ?' },
        newsFocus: { question: 'ਤੁਹਾਡੇ ਲਈ ਕਿਹੜੇ ਖੇਤਰ ਨਿਗਰਾਨੀ ਕਰਾਂ?' },
        privacyBadge: 'ਗੋਪਨੀਯਤਾ ਪਹਿਲਾਂ'
      },
      essentials: {
        title: 'ਜ਼ਰੂਰੀ ਜਾਣਕਾਰੀ',
        gender: { question: 'ਲਿੰਗ', male: 'ਮਰਦ', female: 'ਔਰਤ', nonBinary: 'ਨਾਨ-ਬਾਈਨਰੀ', preferNotToSay: 'ਦੱਸਣਾ ਨਹੀਂ ਚਾਹੁੰਦਾ' },
        age: { question: 'ਉਮਰ', placeholder: 'ਆਪਣੀ ਉਮਰ ਦਰਜ ਕਰੋ' },
        bloodGroup: { question: 'ਖੂਨ ਦਾ ਗਰੁੱਪ' },
        bodyType: { question: 'ਸਰੀਰ ਦੀ ਕਿਸਮ', weight: 'ਭਾਰ (ਕਿਲੋ)' },
        allergies: { question: 'ਐਲਰਜੀਆਂ', addCustom: 'ਕਸਟਮ ਐਲਰਜੀ ਸ਼ਾਮਲ ਕਰੋ' },
        skinTone: { question: 'ਚਮੜੀ ਦਾ ਰੰਗ' }
      },
      health: { title: 'ਸਿਹਤ ਇੰਜਣ', question: 'ਅਸੀਂ ਤੁਹਾਡੇ ਸਰੀਰ ਨੂੰ ਕਿਵੇਂ ਅਨੁਕੂਲ ਬਣਾ ਰਹੇ ਹਾਂ?' }
    },
    professions: { doctor: 'ਡਾਕਟਰ', nurse: 'ਨਰਸ', pharmacist: 'ਫਾਰਮਾਸਿਸਟ', founder: 'ਸੰਸਥਾਪਕ', entrepreneur: 'ਉਦਯੋਗਪਤੀ', retiring: 'ਸੇਵਾਮੁਕਤ', jobless: 'ਬੇਰੁਜ਼ਗਾਰ', finance: 'ਵਿੱਤ', marketing: 'ਮਾਰਕੀਟਿੰਗ', whiteCollar: 'ਦਫ਼ਤਰੀ ਕਰਮਚਾਰੀ', blueCollar: 'ਮਜ਼ਦੂਰ', mechanic: 'ਮਕੈਨਿਕ' },
    languages: { en: 'ਅੰਗਰੇਜ਼ੀ', es: 'ਸਪੈਨਿਸ਼', fr: 'ਫਰਾਂਸੀਸੀ', de: 'ਜਰਮਨ', ar: 'ਅਰਬੀ', zh: 'ਚੀਨੀ', ja: 'ਜਾਪਾਨੀ', pa: 'ਪੰਜਾਬੀ' }
  },
  // European languages
  et: {
    onboarding: {
      welcome: 'Tere tulemast Saydosse',
      subtitle: 'Seadistame sind',
      step: 'Samm',
      of: '/',
      next: 'Edasi',
      back: 'Tagasi',
      continue: 'Jätka',
      skip: 'Jäta vahele',
      finish: 'Lõpeta'
    },
    steps: {
      language: { title: 'Keele valik', question: 'Mis keeles me räägime?' },
      name: { title: 'Eelistatud nimi', question: 'Kuidas ma sind kutsun?', placeholder: 'Sisesta eelistatud nimi' },
      profession: {
        title: 'Professionaalne DNA',
        question: 'Mis on sinu elukutse?',
        manualEntry: 'Käsitsi sisestamine',
        criticalArtifacts: '{profession} rollis, millised on sinu "Kriitilised artefaktid"?',
        addCustom: 'Lisa kohandatud',
        customProfession: 'Kohandatud elukutse',
        customProfessionDesc: 'Sisesta elukutse nimi',
        customArtifact: 'Kohandatud artefakt',
        customArtifactDesc: 'Sisesta artefakti nimi'
      },
      informationDiet: {
        title: 'Teabe dieet',
        socialIntelligence: { question: 'Kust sa saad oma parimad ideed?' },
        newsFocus: { question: 'Milliseid valdkondi peaksin sinu jaoks jälgima?' },
        privacyBadge: 'Privaatsus esmalt'
      },
      essentials: {
        title: 'Põhiandmed',
        gender: { question: 'Sugu', male: 'Mees', female: 'Naine', nonBinary: 'Mittebinarysel', preferNotToSay: 'Eelistan mitte öelda' },
        age: { question: 'Vanus', placeholder: 'Sisesta oma vanus' },
        bloodGroup: { question: 'Veregrupp' },
        bodyType: { question: 'Kehatüüp', weight: 'Kaal (kg)' },
        allergies: { question: 'Allergiad', addCustom: 'Lisa kohandatud allergia' },
        skinTone: { question: 'Nahatoon' }
      },
      health: { title: 'Tervisemootor', question: 'Kuidas me sinu keha optimeerime?' }
    },
    professions: { doctor: 'Arst', nurse: 'Õde', pharmacist: 'Apteeker', founder: 'Asutaja', entrepreneur: 'Ettevõtja', retiring: 'Pensionär', jobless: 'Töötu', finance: 'Rahandus', marketing: 'Turundus', whiteCollar: 'Kontoritöötaja', blueCollar: 'Töötaja', mechanic: 'Mehaanik' },
    languages: { en: 'Inglise', es: 'Hispaania', fr: 'Prantsuse', de: 'Saksa', ar: 'Araabia', zh: 'Hiina', ja: 'Jaapani', et: 'Eesti' }
  },
  lv: {
    onboarding: {
      welcome: 'Laipni lūdzam Saydo',
      subtitle: 'Iestatīsim jūs',
      step: 'Solis',
      of: 'no',
      next: 'Tālāk',
      back: 'Atpakaļ',
      continue: 'Turpināt',
      skip: 'Izlaist',
      finish: 'Pabeigt'
    },
    steps: {
      language: { title: 'Valodas izvēle', question: 'Kādā valodā mēs runājam?' },
      name: { title: 'Vēlamais vārds', question: 'Kā jūs saukt?', placeholder: 'Ievadiet vēlamo vārdu' },
      profession: {
        title: 'Profesionālā DNS',
        question: 'Kāda ir jūsu profesija?',
        manualEntry: 'Manuālā ievade',
        criticalArtifacts: 'Kā {profession}, kādi ir jūsu "Kritiskie artefakti"?',
        addCustom: 'Pievienot pielāgotu',
        customProfession: 'Pielāgota profesija',
        customProfessionDesc: 'Ievadiet profesijas nosaukumu',
        customArtifact: 'Pielāgots artefakts',
        customArtifactDesc: 'Ievadiet artefakta nosaukumu'
      },
      informationDiet: {
        title: 'Informācijas diēta',
        socialIntelligence: { question: 'Kur jūs gūstat labākās idejas?' },
        newsFocus: { question: 'Kādas nozares man jums jāuzrauga?' },
        privacyBadge: 'Privātums vispirms'
      },
      essentials: {
        title: 'Pamatinformācija',
        gender: { question: 'Dzimums', male: 'Vīrietis', female: 'Sieviete', nonBinary: 'Nebinārais', preferNotToSay: 'Nevēlos teikt' },
        age: { question: 'Vecums', placeholder: 'Ievadiet savu vecumu' },
        bloodGroup: { question: 'Asins grupa' },
        bodyType: { question: 'Ķermeņa tips', weight: 'Svars (kg)' },
        allergies: { question: 'Alerģijas', addCustom: 'Pievienot pielāgotu alerģiju' },
        skinTone: { question: 'Ādas tonis' }
      },
      health: { title: 'Veselības dzinējs', question: 'Kā mēs optimizējam jūsu ķermeni?' }
    },
    professions: { doctor: 'Ārsts', nurse: 'Medmāsa', pharmacist: 'Farmaceits', founder: 'Dibinātājs', entrepreneur: 'Uzņēmējs', retiring: 'Pensionārs', jobless: 'Bezdarbnieks', finance: 'Finanses', marketing: 'Mārketings', whiteCollar: 'Biroja darbinieks', blueCollar: 'Strādnieks', mechanic: 'Mehāniķis' },
    languages: { en: 'Angļu', es: 'Spāņu', fr: 'Franču', de: 'Vācu', ar: 'Arābu', zh: 'Ķīniešu', ja: 'Japāņu', lv: 'Latviešu' }
  },
  lt: {
    onboarding: {
      welcome: 'Sveiki atvykę į Saydo',
      subtitle: 'Nustatykime jus',
      step: 'Žingsnis',
      of: 'iš',
      next: 'Toliau',
      back: 'Atgal',
      continue: 'Tęsti',
      skip: 'Praleisti',
      finish: 'Baigti'
    },
    steps: {
      language: { title: 'Kalbos pasirinkimas', question: 'Kokia kalba kalbame?' },
      name: { title: 'Pageidaujamas vardas', question: 'Kaip jus vadinti?', placeholder: 'Įveskite pageidaujamą vardą' },
      profession: {
        title: 'Profesinis DNR',
        question: 'Kokia jūsų profesija?',
        manualEntry: 'Rankinis įvedimas',
        criticalArtifacts: 'Kaip {profession}, kokie jūsų "Kritiniai artefaktai"?',
        addCustom: 'Pridėti pasirinktinį',
        customProfession: 'Pasirinktinė profesija',
        customProfessionDesc: 'Įveskite profesijos pavadinimą',
        customArtifact: 'Pasirinktinis artefaktas',
        customArtifactDesc: 'Įveskite artefakto pavadinimą'
      },
      informationDiet: {
        title: 'Informacijos dieta',
        socialIntelligence: { question: 'Iš kur gaunate geriausias idėjas?' },
        newsFocus: { question: 'Kokias sritis turėčiau stebėti jums?' },
        privacyBadge: 'Privatumas pirmiausia'
      },
      essentials: {
        title: 'Pagrindinė informacija',
        gender: { question: 'Lytis', male: 'Vyras', female: 'Moteris', nonBinary: 'Nebinarinis', preferNotToSay: 'Nenoriu sakyti' },
        age: { question: 'Amžius', placeholder: 'Įveskite savo amžių' },
        bloodGroup: { question: 'Kraujo grupė' },
        bodyType: { question: 'Kūno tipas', weight: 'Svoris (kg)' },
        allergies: { question: 'Alergijos', addCustom: 'Pridėti pasirinktinę alergiją' },
        skinTone: { question: 'Odos atspalvis' }
      },
      health: { title: 'Sveikatos variklis', question: 'Kaip optimizuojame jūsų kūną?' }
    },
    professions: { doctor: 'Gydytojas', nurse: 'Slaugytoja', pharmacist: 'Vaistininkas', founder: 'Įkūrėjas', entrepreneur: 'Verslininkas', retiring: 'Pensininkas', jobless: 'Bedarbis', finance: 'Finansai', marketing: 'Rinkodara', whiteCollar: 'Biuro darbuotojas', blueCollar: 'Darbininkas', mechanic: 'Mechanikas' },
    languages: { en: 'Anglų', es: 'Ispanų', fr: 'Prancūzų', de: 'Vokiečių', ar: 'Arabų', zh: 'Kinų', ja: 'Japonų', lt: 'Lietuvių' }
  },
  sk: {
    onboarding: {
      welcome: 'Vitajte v Saydo',
      subtitle: 'Poďme vás nastaviť',
      step: 'Krok',
      of: 'z',
      next: 'Ďalej',
      back: 'Späť',
      continue: 'Pokračovať',
      skip: 'Preskočiť',
      finish: 'Dokončiť'
    },
    steps: {
      language: { title: 'Výber jazyka', question: 'Akým jazykom hovoríme?' },
      name: { title: 'Preferované meno', question: 'Ako vás mám volať?', placeholder: 'Zadajte preferované meno' },
      profession: {
        title: 'Profesionálna DNA',
        question: 'Aké je vaše povolanie?',
        manualEntry: 'Ručné zadanie',
        criticalArtifacts: 'Ako {profession}, aké sú vaše "Kritické artefakty"?',
        addCustom: 'Pridať vlastné',
        customProfession: 'Vlastné povolanie',
        customProfessionDesc: 'Zadajte názov povolania',
        customArtifact: 'Vlastný artefakt',
        customArtifactDesc: 'Zadajte názov artefaktu'
      },
      informationDiet: {
        title: 'Informačná diéta',
        socialIntelligence: { question: 'Odkiaľ získavate najlepšie nápady?' },
        newsFocus: { question: 'Ktoré odvetvia mám pre vás sledovať?' },
        privacyBadge: 'Súkromie na prvom mieste'
      },
      essentials: {
        title: 'Základy',
        gender: { question: 'Pohlavie', male: 'Muž', female: 'Žena', nonBinary: 'Nebinárne', preferNotToSay: 'Nechcem uviesť' },
        age: { question: 'Vek', placeholder: 'Zadajte svoj vek' },
        bloodGroup: { question: 'Krvná skupina' },
        bodyType: { question: 'Typ postavy', weight: 'Váha (kg)' },
        allergies: { question: 'Alergie', addCustom: 'Pridať vlastnú alergiu' },
        skinTone: { question: 'Odtieň pleti' }
      },
      health: { title: 'Zdravotný motor', question: 'Ako optimalizujeme vaše telo?' }
    },
    professions: { doctor: 'Lekár', nurse: 'Zdravotná sestra', pharmacist: 'Lekárnik', founder: 'Zakladateľ', entrepreneur: 'Podnikateľ', retiring: 'Dôchodca', jobless: 'Nezamestnaný', finance: 'Financie', marketing: 'Marketing', whiteCollar: 'Kancelársky pracovník', blueCollar: 'Manuálny pracovník', mechanic: 'Mechanik' },
    languages: { en: 'Angličtina', es: 'Španielčina', fr: 'Francúzština', de: 'Nemčina', ar: 'Arabčina', zh: 'Čínština', ja: 'Japončina', sk: 'Slovenčina' }
  },
  sl: {
    onboarding: {
      welcome: 'Dobrodošli v Saydo',
      subtitle: 'Nastavimo vas',
      step: 'Korak',
      of: 'od',
      next: 'Naprej',
      back: 'Nazaj',
      continue: 'Nadaljuj',
      skip: 'Preskoči',
      finish: 'Končaj'
    },
    steps: {
      language: { title: 'Izbira jezika', question: 'Kateri jezik govorimo?' },
      name: { title: 'Želeno ime', question: 'Kako naj vas kličem?', placeholder: 'Vnesite želeno ime' },
      profession: {
        title: 'Profesionalna DNK',
        question: 'Kakšen je vaš poklic?',
        manualEntry: 'Ročni vnos',
        criticalArtifacts: 'Kot {profession}, kateri so vaši "Kritični artefakti"?',
        addCustom: 'Dodaj po meri',
        customProfession: 'Poklic po meri',
        customProfessionDesc: 'Vnesite ime poklica',
        customArtifact: 'Artefakt po meri',
        customArtifactDesc: 'Vnesite ime artefakta'
      },
      informationDiet: {
        title: 'Informacijska dieta',
        socialIntelligence: { question: 'Od kod dobite najboljše ideje?' },
        newsFocus: { question: 'Katere panoge naj spremljam za vas?' },
        privacyBadge: 'Zasebnost na prvem mestu'
      },
      essentials: {
        title: 'Osnove',
        gender: { question: 'Spol', male: 'Moški', female: 'Ženska', nonBinary: 'Nebinarni', preferNotToSay: 'Raje ne povem' },
        age: { question: 'Starost', placeholder: 'Vnesite svojo starost' },
        bloodGroup: { question: 'Krvna skupina' },
        bodyType: { question: 'Tip telesa', weight: 'Teža (kg)' },
        allergies: { question: 'Alergije', addCustom: 'Dodaj alergijo po meri' },
        skinTone: { question: 'Ton kože' }
      },
      health: { title: 'Zdravstveni motor', question: 'Kako optimiziramo vaše telo?' }
    },
    professions: { doctor: 'Zdravnik', nurse: 'Medicinska sestra', pharmacist: 'Farmacevt', founder: 'Ustanovitelj', entrepreneur: 'Podjetnik', retiring: 'Upokojenec', jobless: 'Brezposeln', finance: 'Finance', marketing: 'Trženje', whiteCollar: 'Pisarniški delavec', blueCollar: 'Delavec', mechanic: 'Mehanik' },
    languages: { en: 'Angleščina', es: 'Španščina', fr: 'Francoščina', de: 'Nemščina', ar: 'Arabščina', zh: 'Kitajščina', ja: 'Japonščina', sl: 'Slovenščina' }
  },
  hr: {
    onboarding: {
      welcome: 'Dobrodošli u Saydo',
      subtitle: 'Postavimo vas',
      step: 'Korak',
      of: 'od',
      next: 'Dalje',
      back: 'Natrag',
      continue: 'Nastavi',
      skip: 'Preskoči',
      finish: 'Završi'
    },
    steps: {
      language: { title: 'Odabir jezika', question: 'Koji jezik govorimo?' },
      name: { title: 'Željeno ime', question: 'Kako da vas zovem?', placeholder: 'Unesite željeno ime' },
      profession: {
        title: 'Profesionalni DNK',
        question: 'Koje je vaše zanimanje?',
        manualEntry: 'Ručni unos',
        criticalArtifacts: 'Kao {profession}, koji su vaši "Kritični artefakti"?',
        addCustom: 'Dodaj prilagođeno',
        customProfession: 'Prilagođeno zanimanje',
        customProfessionDesc: 'Unesite naziv zanimanja',
        customArtifact: 'Prilagođeni artefakt',
        customArtifactDesc: 'Unesite naziv artefakta'
      },
      informationDiet: {
        title: 'Informacijska dijeta',
        socialIntelligence: { question: 'Odakle dobivate najbolje ideje?' },
        newsFocus: { question: 'Koje industrije da pratim za vas?' },
        privacyBadge: 'Privatnost na prvom mjestu'
      },
      essentials: {
        title: 'Osnovno',
        gender: { question: 'Spol', male: 'Muško', female: 'Žensko', nonBinary: 'Nebinarno', preferNotToSay: 'Radije ne bih rekao' },
        age: { question: 'Dob', placeholder: 'Unesite svoju dob' },
        bloodGroup: { question: 'Krvna grupa' },
        bodyType: { question: 'Tip tijela', weight: 'Težina (kg)' },
        allergies: { question: 'Alergije', addCustom: 'Dodaj prilagođenu alergiju' },
        skinTone: { question: 'Ton kože' }
      },
      health: { title: 'Zdravstveni motor', question: 'Kako optimiziramo vaše tijelo?' }
    },
    professions: { doctor: 'Liječnik', nurse: 'Medicinska sestra', pharmacist: 'Ljekarnik', founder: 'Osnivač', entrepreneur: 'Poduzetnik', retiring: 'Umirovljenik', jobless: 'Nezaposlen', finance: 'Financije', marketing: 'Marketing', whiteCollar: 'Uredski radnik', blueCollar: 'Radnik', mechanic: 'Mehaničar' },
    languages: { en: 'Engleski', es: 'Španjolski', fr: 'Francuski', de: 'Njemački', ar: 'Arapski', zh: 'Kineski', ja: 'Japanski', hr: 'Hrvatski' }
  },
  sr: {
    onboarding: {
      welcome: 'Добродошли у Saydo',
      subtitle: 'Хајде да вас подесимо',
      step: 'Корак',
      of: 'од',
      next: 'Даље',
      back: 'Назад',
      continue: 'Настави',
      skip: 'Прескочи',
      finish: 'Заврши'
    },
    steps: {
      language: { title: 'Избор језика', question: 'Којим језиком говоримо?' },
      name: { title: 'Жељено име', question: 'Како да вас зовем?', placeholder: 'Унесите жељено име' },
      profession: {
        title: 'Професионални ДНК',
        question: 'Које је ваше занимање?',
        manualEntry: 'Ручни унос',
        criticalArtifacts: 'Као {profession}, који су ваши "Критични артефакти"?',
        addCustom: 'Додај прилагођено',
        customProfession: 'Прилагођено занимање',
        customProfessionDesc: 'Унесите назив занимања',
        customArtifact: 'Прилагођени артефакт',
        customArtifactDesc: 'Унесите назив артефакта'
      },
      informationDiet: {
        title: 'Информациона дијета',
        socialIntelligence: { question: 'Одакле добијате најбоље идеје?' },
        newsFocus: { question: 'Које индустрије да пратим за вас?' },
        privacyBadge: 'Приватност на првом месту'
      },
      essentials: {
        title: 'Основно',
        gender: { question: 'Пол', male: 'Мушко', female: 'Женско', nonBinary: 'Небинарно', preferNotToSay: 'Радије не бих рекао' },
        age: { question: 'Старост', placeholder: 'Унесите своју старост' },
        bloodGroup: { question: 'Крвна група' },
        bodyType: { question: 'Тип тела', weight: 'Тежина (kg)' },
        allergies: { question: 'Алергије', addCustom: 'Додај прилагођену алергију' },
        skinTone: { question: 'Тон коже' }
      },
      health: { title: 'Здравствени мотор', question: 'Како оптимизујемо ваше тело?' }
    },
    professions: { doctor: 'Лекар', nurse: 'Медицинска сестра', pharmacist: 'Фармацеут', founder: 'Оснивач', entrepreneur: 'Предузетник', retiring: 'Пензионер', jobless: 'Незапослен', finance: 'Финансије', marketing: 'Маркетинг', whiteCollar: 'Канцеларијски радник', blueCollar: 'Радник', mechanic: 'Механичар' },
    languages: { en: 'Енглески', es: 'Шпански', fr: 'Француски', de: 'Немачки', ar: 'Арапски', zh: 'Кинески', ja: 'Јапански', sr: 'Српски' }
  }
}

// Merge all translations - ensure all languages are included
const allTranslations: Record<Language, Translations> = {
  ...coreTranslations,
  ...additionalLanguages
}

// Validate that all languages are included
const allLanguageCodes: Language[] = ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'pt', 'it', 'ru', 'ko', 'hi', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'el', 'he', 'th', 'vi', 'id', 'cs', 'ro', 'hu', 'uk', 'bg', 'sw', 'yo', 'ig', 'ha', 'rw', 'zu', 'am', 'tl', 'ms', 'bn', 'ta', 'te', 'ur', 'pa', 'et', 'lv', 'lt', 'sk', 'sl', 'hr', 'sr']
for (const langCode of allLanguageCodes) {
  if (!allTranslations[langCode]) {
    console.error(`Missing translation for language: ${langCode}`)
    // Ensure fallback exists
    allTranslations[langCode] = allTranslations.en
  }
}

export function getTranslation(lang: Language): Translations {
  // Return translation if exists, otherwise fallback to English
  const translation = allTranslations[lang]
  if (!translation) {
    // Fallback to English if translation not found
    console.warn(`Translation not found for language: ${lang}, falling back to English`)
    return allTranslations.en
  }
  return translation
}

export function translate(key: string, lang: Language, params?: Record<string, string>): string {
  const keys = key.split('.')
  let value: any = allTranslations[lang]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, param) => params[param] || '')
  }
  
  return value
}

