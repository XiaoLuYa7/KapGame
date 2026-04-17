package com.beiguo.service;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.SysDict;
import java.util.List;
import java.util.Map;

public interface SysDictService {

    ApiResponse<List<SysDict>> getDictByCategory(String category);

    ApiResponse<Map<String, List<SysDict>>> getDictByCategories(List<String> categories);

    ApiResponse<List<SysDict>> getAllDicts();
}
