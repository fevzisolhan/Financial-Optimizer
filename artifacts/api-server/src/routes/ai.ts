import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] || "dummy",
});

const SYSTEM_PROMPT = `Sen "Soba AI", Türkiye'deki bir soba/sıcak hava üfleyici mağazasının yönetim sistemine entegre akıllı iş asistanısın.

Görevin:
- Kullanıcının işletme verilerini analiz etmek
- Satış trendlerini yorumlamak
- Stok optimizasyonu önerileri sunmak
- Kâr/zarar analizi yapmak
- Tedarikçi yönetimi hakkında tavsiye vermek
- Nakit akışını yorumlamak
- Türkçe, samimi ve iş odaklı yanıtlar vermek

Kurallar:
- Her zaman Türkçe yanıt ver
- Para birimini ₺ (TRY) olarak kullan
- Sayıları Türk formatında yaz (1.234,56 ₺)
- Kısa, net ve uygulanabilir öneriler sun
- Eğer bir şeyi bilmiyorsan "Bu konuda yeterli verim yok" de
- Markdown kullanabilirsin (kalın, liste, başlık)`;

router.post("/chat", async (req, res) => {
  const { messages, context } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
    context?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages gerekli" });
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const systemMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (context) {
      systemMessages.push({
        role: "system",
        content: `Kullanıcının mevcut işletme verileri:\n\n${context}`,
      });
    }

    const allMessages: OpenAI.ChatCompletionMessageParam[] = [
      ...systemMessages,
      ...messages,
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: allMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI hatası";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

export default router;
