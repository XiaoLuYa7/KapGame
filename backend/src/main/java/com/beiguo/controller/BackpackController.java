package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import com.beiguo.dto.BackpackItemDTO;
import com.beiguo.service.BackpackService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/backpack")
public class BackpackController {
    private final BackpackService backpackService;

    public BackpackController(BackpackService backpackService) {
        this.backpackService = backpackService;
    }

    @GetMapping("/items")
    public ApiResponse<List<BackpackItemDTO>> getItems(
            @RequestParam(defaultValue = "decorate") String category
    ) {
        try {
            return ApiResponse.success(backpackService.getCurrentUserItems(category));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
