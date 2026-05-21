package com.beiguo.service;

import com.beiguo.dto.BackpackItemDTO;

import java.util.List;

public interface BackpackService {
    List<BackpackItemDTO> getCurrentUserItems(String category);
}
