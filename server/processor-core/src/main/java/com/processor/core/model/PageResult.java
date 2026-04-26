package com.processor.core.model;

import java.util.List;

public record PageResult<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
    public static <T> PageResult<T> of(List<T> content, int page, int size, long total) {
        int pages = size <= 0 ? 0 : (int) ((total + size - 1) / size);
        return new PageResult<>(content, page, size, total, pages);
    }
}
