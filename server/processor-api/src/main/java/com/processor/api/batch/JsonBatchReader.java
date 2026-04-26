package com.processor.api.batch;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.processor.core.model.ParsedFileRow;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component
public class JsonBatchReader {

    private final ObjectMapper objectMapper;

    public JsonBatchReader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<ParsedFileRow> read(InputStream input) throws IOException {
        JsonNode root = objectMapper.readTree(input);
        if (!root.isArray()) {
            throw new IllegalArgumentException("JSON batch must be an array of row objects");
        }
        List<ParsedFileRow> rows = new ArrayList<>();
        int rowNum = 0;
        for (Iterator<JsonNode> it = root.elements(); it.hasNext();) {
            rowNum++;
            JsonNode o = it.next();
            if (!o.isObject()) {
                continue;
            }
            String card = text(o, "cardNumber", "card", "number");
            BigDecimal amount = o.has("amount") && !o.get("amount").isNull()
                    ? new BigDecimal(o.get("amount").asText())
                    : null;
            String currency = text(o, "currency");
            if (currency == null || currency.isEmpty()) {
                currency = "USD";
            }
            String ch = text(o, "cardholderName", "name", "cardholder");
            String ts = text(o, "occurredAt", "timestamp", "time");
            Instant when = ts != null && !ts.isEmpty() ? Instant.parse(ts) : Instant.now();
            if (card == null || amount == null) {
                continue;
            }
            rows.add(new ParsedFileRow(rowNum, card, ch, amount, currency, when));
        }
        return rows;
    }

    private static String text(JsonNode o, String... names) {
        for (String n : names) {
            if (o.has(n) && !o.get(n).isNull()) {
                return o.get(n).asText();
            }
        }
        return null;
    }
}
