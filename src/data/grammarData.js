export default [
  {
    id: 'because-so',
    title: 'Nêu nguyên nhân và kết quả',
    pattern: '因为……所以……',
    level: 'Cơ bản',
    explanation: '因为 giới thiệu nguyên nhân, 所以 giới thiệu kết quả. Trong hội thoại, đôi khi có thể lược bỏ một trong hai từ, nhưng dùng cả cặp giúp quan hệ ý rõ ràng.',
    examples: [
      {
        hanzi: '因为信号不稳定，所以设备无法连接。',
        pinyin: 'Yīnwèi xìnhào bù wěndìng, suǒyǐ shèbèi wúfǎ liánjiē.',
        meaning: 'Vì tín hiệu không ổn định nên thiết bị không thể kết nối.'
      }
    ],
    questions: [
      {
        prompt: '___信号不稳定，___设备无法连接。',
        options: ['因为……所以……', '虽然……但是……', '一边……一边……'],
        answer: 0,
        explanation: 'Câu nêu nguyên nhân (tín hiệu không ổn định) và kết quả (thiết bị không kết nối được).'
      },
      {
        prompt: 'Chọn câu diễn đạt đúng ý “Vì máy quá nóng nên chúng tôi dừng máy kiểm tra.”',
        options: [
          '因为机器太热，所以我们停机检查。',
          '虽然机器太热，所以我们停机检查。',
          '机器因为比太热，我们停机检查。'
        ],
        answer: 0,
        explanation: 'Dùng 因为……所以…… để nối nguyên nhân và kết quả.'
      }
    ]
  },
  {
    id: 'first-then',
    title: 'Nói thứ tự thao tác',
    pattern: '先……再……',
    level: 'Cơ bản',
    explanation: '先 đặt trước hành động xảy ra trước; 再 đặt trước hành động tiếp theo. Mẫu này hữu ích khi hướng dẫn trình tự thao tác.',
    examples: [
      {
        hanzi: '请先保存数据，再重启服务器。',
        pinyin: 'Qǐng xiān bǎocún shùjù, zài chóngqǐ fúwùqì.',
        meaning: 'Hãy lưu dữ liệu trước, rồi khởi động lại máy chủ.'
      }
    ],
    questions: [
      {
        prompt: '___断开电源，___检查线路。',
        options: ['先……再……', '比……更……', '因为……所以……'],
        answer: 0,
        explanation: '先断开电源 (ngắt nguồn trước), 再检查线路 (sau đó kiểm tra dây).'
      },
      {
        prompt: 'Điền từ phù hợp: 请先保存测试数据，___重新启动服务器。',
        options: ['再', '被', '比'],
        answer: 0,
        explanation: '再 đứng trước hành động xảy ra tiếp theo.'
      }
    ]
  },
  {
    id: 'ba-construction',
    title: 'Nêu rõ đối tượng được xử lý',
    pattern: '把 + tân ngữ + động từ',
    level: 'Cơ bản',
    explanation: '把 đưa tân ngữ lên trước động từ để nhấn mạnh việc xử lý đối tượng đó. Sau động từ thường có kết quả, hướng, hoặc thành phần bổ sung.',
    examples: [
      {
        hanzi: '请把这份报告发给主管。',
        pinyin: 'Qǐng bǎ zhè fèn bàogào fā gěi zhǔguǎn.',
        meaning: 'Hãy gửi bản báo cáo này cho quản lý.'
      }
    ],
    questions: [
      {
        prompt: 'Câu nào có trật tự từ đúng với mẫu 把?',
        options: [
          '请把设备关掉。',
          '请设备把关掉。',
          '请关掉把设备。'
        ],
        answer: 0,
        explanation: 'Cấu trúc là 把 + thiết bị + động từ/cụm động từ: 把设备关掉.'
      },
      {
        prompt: 'Điền cụm phù hợp: 请把测试结果___在系统里。',
        options: ['记录下来', '比', '虽然'],
        answer: 0,
        explanation: '记录下来 là cụm động từ nêu kết quả xử lý đối tượng 测试结果.'
      }
    ]
  },
  {
    id: 'passive-bei',
    title: 'Diễn đạt câu bị động',
    pattern: '受事 + 被 + người/vật thực hiện + động từ',
    level: 'Trung cấp',
    explanation: '被 dùng khi chủ ngữ là đối tượng chịu tác động. Có thể lược bỏ người/vật thực hiện nếu không quan trọng hoặc chưa biết.',
    examples: [
      {
        hanzi: '这台设备已经被工程师修好了。',
        pinyin: 'Zhè tái shèbèi yǐjīng bèi gōngchéngshī xiū hǎo le.',
        meaning: 'Thiết bị này đã được kỹ sư sửa xong.'
      }
    ],
    questions: [
      {
        prompt: 'Điền từ: 样品___放在检测台上了。',
        options: ['被', '把', '比'],
        answer: 0,
        explanation: 'Mẫu vật là đối tượng được đặt lên bàn kiểm tra, nên dùng 被.'
      },
      {
        prompt: 'Điền từ: 设备已经___工程师修好了。',
        options: ['被', '比', '所以'],
        answer: 0,
        explanation: 'Thiết bị là đối tượng chịu tác động của hành động sửa chữa.'
      }
    ]
  },
  {
    id: 'comparison-bi',
    title: 'So sánh hai đối tượng',
    pattern: 'A + 比 + B + tính từ',
    level: 'Cơ bản',
    explanation: '比 đặt giữa đối tượng được so sánh và đối tượng làm mốc. Tính từ đứng sau B; có thể thêm 更 để nhấn mạnh.',
    examples: [
      {
        hanzi: '这台设备比那台设备更稳定。',
        pinyin: 'Zhè tái shèbèi bǐ nà tái shèbèi gèng wěndìng.',
        meaning: 'Thiết bị này ổn định hơn thiết bị kia.'
      }
    ],
    questions: [
      {
        prompt: 'Điền từ: 这台设备___那台设备更稳定。',
        options: ['比', '把', '被'],
        answer: 0,
        explanation: 'Mẫu so sánh là A + 比 + B + tính từ.'
      },
      {
        prompt: 'Điền cụm phù hợp: 今天的温度比昨天___。',
        options: ['低两度', '两度低比', '被低两度'],
        answer: 0,
        explanation: 'Sau đối tượng so sánh 昨天 là tính từ 低, rồi đến mức chênh lệch 两度.'
      }
    ]
  },
  {
    id: 'if-then',
    title: 'Nêu điều kiện và kết quả',
    pattern: '如果……就……',
    level: 'Cơ bản',
    explanation: '如果 giới thiệu điều kiện; 就 nêu kết quả sẽ xảy ra khi điều kiện đó được đáp ứng.',
    examples: [
      {
        hanzi: '如果指示灯变红，就马上停机。',
        pinyin: 'Rúguǒ zhǐshìdēng biàn hóng, jiù mǎshàng tíngjī.',
        meaning: 'Nếu đèn báo chuyển đỏ thì dừng máy ngay.'
      }
    ],
    questions: [
      {
        prompt: '___指示灯变红，___马上停机。',
        options: ['如果……就……', '因为……但是……', '先……比……'],
        answer: 0,
        explanation: '如果 nêu điều kiện; 就 nêu kết quả tương ứng.'
      },
      {
        prompt: 'Chọn câu có nghĩa “Nếu không thể kết nối thì khởi động lại thiết bị.”',
        options: [
          '如果无法连接，就重新启动设备。',
          '虽然无法连接，但是重新启动设备。',
          '因为无法连接，比重新启动设备。'
        ],
        answer: 0,
        explanation: 'Đây là điều kiện và kết quả nên dùng 如果……就…….'
      }
    ]
  },
  {
    id: 'although-but',
    title: 'Nêu ý tương phản',
    pattern: '虽然……但是……',
    level: 'Trung cấp',
    explanation: '虽然 nêu tình huống có vẻ dẫn đến một kết quả; 但是 giới thiệu kết quả thực tế tương phản với kỳ vọng đó.',
    examples: [
      {
        hanzi: '虽然测试通过了，但是还需要确认数据。',
        pinyin: 'Suīrán cèshì tōngguò le, dànshì hái xūyào quèrèn shùjù.',
        meaning: 'Mặc dù bài kiểm tra đã đạt, nhưng vẫn cần xác nhận dữ liệu.'
      }
    ],
    questions: [
      {
        prompt: '___测试通过了，___还需要复查数据。',
        options: ['虽然……但是……', '因为……所以……', '一边……一边……'],
        answer: 0,
        explanation: 'Hai vế tương phản: đã đạt nhưng vẫn cần kiểm tra lại.'
      },
      {
        prompt: 'Chọn câu đúng với ý “Mặc dù máy đã khởi động lại, nhưng vấn đề vẫn còn.”',
        options: [
          '虽然机器已经重启了，但是问题还在。',
          '因为机器已经重启了，但是问题还在。',
          '机器虽然比重启了，就问题还在。'
        ],
        answer: 0,
        explanation: '虽然……但是…… nối hai ý tương phản.'
      }
    ]
  },
  {
    id: 'simultaneous-yibian',
    title: 'Diễn tả hai việc đồng thời',
    pattern: '一边……一边……',
    level: 'Trung cấp',
    explanation: '一边……一边…… diễn tả hai hành động diễn ra cùng lúc, thường do cùng một chủ thể thực hiện.',
    examples: [
      {
        hanzi: '他一边检查线路，一边记录结果。',
        pinyin: 'Tā yìbiān jiǎnchá xiànlù, yìbiān jìlù jiéguǒ.',
        meaning: 'Anh ấy vừa kiểm tra dây chuyền vừa ghi lại kết quả.'
      }
    ],
    questions: [
      {
        prompt: '他___检查线路，___记录结果。',
        options: ['一边……一边……', '如果……就……', '先……再……'],
        answer: 0,
        explanation: 'Hai hành động kiểm tra và ghi kết quả diễn ra đồng thời.'
      },
      {
        prompt: 'Chọn câu đúng với ý “Cô ấy vừa nghe hướng dẫn vừa ghi chú.”',
        options: [
          '她一边听说明，一边做记录。',
          '她虽然听说明，所以做记录。',
          '她比听说明，被做记录。'
        ],
        answer: 0,
        explanation: '一边……一边…… dùng cho hai hành động đồng thời.'
      }
    ]
  },
  {
    id: 'during-process-reporting',
    title: 'Mô tả sự việc trong một quá trình',
    pattern: '在……过程中，发生 / 发现了……',
    level: 'Cơ bản',
    explanation: '在……过程中 đặt bối cảnh “trong quá trình…”. Dùng 发生 khi sự cố xảy ra; dùng 发现 khi người nói phát hiện ra vấn đề.',
    examples: [
      {
        hanzi: '在测试过程中，发现了异常。',
        pinyin: 'Zài cè shì guò chéng zhōng, fā xiàn le yì cháng.',
        meaning: 'Trong quá trình test, đã phát hiện bất thường.'
      },
      {
        hanzi: '在生产过程中，发生了故障。',
        pinyin: 'Zài shēng chǎn guò chéng zhōng, fā shēng le gù zhàng.',
        meaning: 'Trong quá trình sản xuất đã xảy ra sự cố.'
      }
    ],
    questions: [
      {
        prompt: '在测试过程中，___了异常。',
        options: ['发现', '发生', '反馈', '待处理'],
        answer: 0,
        explanation: '发现 nghĩa là phát hiện ra điều bất thường.'
      },
      {
        prompt: '在生产过程中，___了故障。',
        options: ['发现', '发生', '反馈', '待处理'],
        answer: 1,
        explanation: '故障 là sự cố xảy ra, nên dùng 发生了故障.'
      }
    ]
  },
  {
    id: 'send-information-ba',
    title: 'Yêu cầu gửi thông tin cho ai',
    pattern: '请把 + thông tin + 发给 + người nhận',
    level: 'Cơ bản',
    explanation: '请把…发给… là cách lịch sự để yêu cầu gửi một thông tin hoặc tài liệu cho người nhận. 把 đưa đối tượng cần gửi lên trước cụm động từ 发给.',
    examples: [
      {
        hanzi: '请把序列号发给我。',
        pinyin: 'Qǐng bǎ xù liè hào fā gěi wǒ.',
        meaning: 'Vui lòng gửi số serial cho tôi.'
      },
      {
        hanzi: '请把测试截图发给TE。',
        pinyin: 'Qǐng bǎ cè shì jié tú fā gěi TE.',
        meaning: 'Vui lòng gửi ảnh chụp kết quả test cho TE.'
      }
    ],
    questions: [
      {
        prompt: 'Chọn câu có nghĩa “Vui lòng gửi số serial cho tôi.”',
        options: [
          '请把序列号发给我。',
          '请发给我序列号把。',
          '请把我发给序列号。',
          '请序列号把发给我。'
        ],
        answer: 0,
        explanation: 'Trật tự là 请把 + thông tin 序列号 + 发给 + người nhận 我.'
      },
      {
        prompt: '请把测试截图___TE。',
        options: ['发给', '发生', '发现', '待处理'],
        answer: 0,
        explanation: '发给 nối thông tin được gửi với người nhận.'
      }
    ]
  },
  {
    id: 'fasheng-faxian',
    title: 'Phân biệt 发生 và 发现',
    pattern: '发生 = xảy ra · 发现 = phát hiện',
    level: 'Cơ bản',
    explanation: '发生 tập trung vào việc một sự việc/sự cố xảy ra. 发现 tập trung vào việc ai đó nhận ra hoặc phát hiện vấn đề.',
    examples: [
      {
        hanzi: '发生故障。',
        pinyin: 'Fā shēng gù zhàng.',
        meaning: 'Xảy ra sự cố.'
      },
      {
        hanzi: '发现异常。',
        pinyin: 'Fā xiàn yì cháng.',
        meaning: 'Phát hiện bất thường.'
      }
    ],
    questions: [
      {
        prompt: 'Chọn từ phù hợp: 生产过程中___了故障。',
        options: ['发生', '发现', '反馈', '确认'],
        answer: 0,
        explanation: 'Sự cố xảy ra nên dùng 发生了故障.'
      },
      {
        prompt: 'Chọn từ phù hợp: 测试过程中___了异常。',
        options: ['发生', '发现', '反馈', '确认'],
        answer: 1,
        explanation: 'Người nói phát hiện bất thường nên dùng 发现了异常.'
      }
    ]
  }
]
