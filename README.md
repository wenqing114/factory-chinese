# TE Chinese Lab

Website học tiếng Trung kỹ thuật nhà máy, xây dựng bằng Vue 3 và Vite. Giao diện có các chế độ học từ vựng, flashcard, nghe, trắc nghiệm, luyện gõ, ghép cặp, câu mẫu, ngữ pháp, ôn từ khó và sao lưu tiến độ. Trong Ghép cặp, mỗi lượt có tối đa 5 cặp; công tắc ngay trên màn hình làm bài cho phép dừng khi hết bộ hoặc tự động lặp lại bộ từ.

## Chạy dự án

Cần cài Node.js phiên bản LTS (bao gồm npm). Tại thư mục dự án, chạy:

```sh
npm install
npm run dev
```

Mở URL được Vite hiển thị trong terminal. Tạo bản dựng triển khai bằng `npm run build`; kiểm tra bản dựng với `npm run preview`.

## Cấu trúc

- `src/main.js` — khởi tạo ứng dụng Vue và nạp stylesheet.
- `src/App.vue` — bố cục ứng dụng.
- `src/components/` — thanh điều hướng, phần đầu trang và vùng học.
- `src/data/studyData.js` — dữ liệu từ vựng/câu mẫu.
- `src/data/grammarData.js` — chủ điểm, ví dụ và câu hỏi luyện ngữ pháp.
- `src/legacy/app.js` — bộ điều khiển các hoạt động học hiện có.
- `src/styles/` — stylesheet giao diện.

Vùng học đang dùng bộ điều khiển tương thích để giữ nguyên các tính năng và tiến độ hiện có trong quá trình chuyển sang Vue; dữ liệu tiếp tục được lưu trong `localStorage` tại trình duyệt.

## Bộ từ vựng

Mục **Từ vựng** có sẵn các bộ theo chủ đề, cho phép tạo bộ riêng và thêm từ mới. Từ tự thêm được tự tạo pinyin, lưu vào bộ theo ngày tạo và có thể đưa vào các bộ riêng; xóa từ tự thêm không ảnh hưởng dữ liệu gốc. Mở một bộ để nghe từ, xem trạng thái học, hoặc bắt đầu Flashcard/Trắc nghiệm chỉ với các từ trong bộ đó. Bộ riêng và từ tự thêm được lưu trong `localStorage` của trình duyệt hiện tại. Từ vựng trong tài liệu Công xưởng – Ngày 5 cũng nằm trong bộ theo ngày thêm và chủ đề **Báo cáo lỗi sản phẩm**.

## Giọng đọc và tiến độ

Ứng dụng có hai giọng Azure Speech Mandarin: **Xiaoxiao Dragon HD Flash Latest** và **Yunyi Dragon HD Flash Latest**. Có thể chọn thêm giọng Mandarin sẵn có trên thiết bị làm phương án thay thế. Giọng Azure được tổng hợp qua API phía máy chủ; khóa Speech không được gửi xuống trình duyệt. Tiến độ lưu trong `localStorage`; có thể sao lưu JSON ở mục Thống kê.

### Cấu hình Azure Speech trên Vercel

1. Tạo một Azure Speech resource và chọn region hỗ trợ các giọng HD Flash đã chọn.
2. Trong Vercel, thêm hai Environment Variables: `AZURE_SPEECH_KEY` (khóa resource) và `AZURE_SPEECH_REGION` (region của resource). Không đặt chúng trong biến `VITE_*` hoặc trong mã frontend.
3. Triển khai lại website. Vercel tự nhận endpoint `api/speech.js`; yêu cầu đọc giới hạn 500 ký tự và 30 lần/phút trên mỗi IP theo từng instance.

Khi chạy dự án bằng `npm run dev`, middleware Vite dùng các giá trị `AZURE_SPEECH_KEY` và `AZURE_SPEECH_REGION` trong file `.env` tại thư mục dự án. Thêm các biến này vào `.env` hiện có; `.env.example` liệt kê tên biến cần thiết. Chưa có resource hoặc cấu hình sai thì phần Giọng đọc sẽ hiển thị lỗi cụ thể; có thể chọn giọng cục bộ trong danh sách để tiếp tục nghe.

Trong mục Luyện câu, pinyin được tự tạo trong trình duyệt bằng `pinyin-pro`; nghĩa tiếng Việt được nhập thủ công. Câu tự thêm lưu trong `localStorage` của trình duyệt và có thể xóa khỏi danh sách bất cứ lúc nào. Câu trong tài liệu Công xưởng – Ngày 5 cũng được xếp vào bộ câu theo ngày thêm.

## Luyện ngữ pháp

Mục **Ngữ pháp** có các chủ điểm tiếng Trung thực dụng, mỗi chủ điểm gồm giải thích, ví dụ có pinyin và câu hỏi trắc nghiệm; bao gồm cấu trúc mô tả sự việc trong quá trình, yêu cầu gửi thông tin và phân biệt 发生/发现 từ tài liệu Công xưởng – Ngày 5. Có thể chọn đáp án bằng chuột hoặc phím `A`–`D`; sau khi chọn, ứng dụng phát âm báo đúng/sai và đọc đáp án tiếng Trung. Tiến độ, số câu đúng và các chủ điểm đã luyện được lưu trong trình duyệt, đồng thời đi cùng file sao lưu tiến độ JSON.

Nếu không có giọng tiếng Trung, vào Windows Settings > Time & language > Language & region > Add a language > Chinese (Simplified), cài gói Speech nếu có rồi tải lại trình duyệt.

## Phím tắt

- Flashcard: `Space` lật thẻ, phím mũi tên chuyển thẻ, `Ctrl` nghe từ.
- Nghe/trắc nghiệm: `A`–`D` hoặc `1`–`4` chọn đáp án, `Enter` sang câu tiếp, `Ctrl` nghe lại. Ở phần Trắc nghiệm, sau âm báo đúng hoặc sai ứng dụng tự đọc từ đúng; nút “Phát âm” cho phép nghe lại. Có thể bấm vào chữ Hán ở câu hỏi để nghe.
- Luyện gõ: `Enter` kiểm tra câu; sau khi chấm, `Enter` hoặc `Space` chuyển câu tiếp theo. `Ctrl` nghe từ hiện tại.
- Phím tắt không can thiệp khi đang nhập văn bản.

Tham khảo [WCAG 2.2 về bàn phím](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [phím tắt ký tự](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) và [KeyboardEvent.key trên MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
