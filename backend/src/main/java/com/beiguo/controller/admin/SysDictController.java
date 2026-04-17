package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.SysDict;
import com.beiguo.service.SysDictService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/dict")
public class SysDictController {

    @Autowired
    private SysDictService sysDictService;

    @GetMapping("/category/{category}")
    public ApiResponse<List<SysDict>> getDictByCategory(@PathVariable String category) {
        return sysDictService.getDictByCategory(category);
    }

    @GetMapping("/categories")
    public ApiResponse<Map<String, List<SysDict>>> getDictByCategories(@RequestParam String categories) {
        List<String> categoryList = java.util.Arrays.asList(categories.split(","));
        return sysDictService.getDictByCategories(categoryList);
    }

    @GetMapping("/all")
    public ApiResponse<List<SysDict>> getAllDicts() {
        return sysDictService.getAllDicts();
    }
}
