package com.beiguo.service.impl;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.SysDict;
import com.beiguo.repository.SysDictRepository;
import com.beiguo.service.SysDictService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SysDictServiceImpl implements SysDictService {

    @Autowired
    private SysDictRepository sysDictRepository;

    @Override
    public ApiResponse<List<SysDict>> getDictByCategory(String category) {
        try {
            List<SysDict> list = sysDictRepository.findByCategoryOrderBySortOrderAsc(category);
            return ApiResponse.success(list);
        } catch (Exception e) {
            return ApiResponse.error("获取字典数据失败: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Map<String, List<SysDict>>> getDictByCategories(List<String> categories) {
        try {
            List<SysDict> allDicts = sysDictRepository.findByCategoryIn(categories);
            Map<String, List<SysDict>> result = allDicts.stream()
                    .collect(Collectors.groupingBy(SysDict::getCategory));
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("获取字典数据失败: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<SysDict>> getAllDicts() {
        try {
            List<SysDict> list = sysDictRepository.findAll();
            return ApiResponse.success(list);
        } catch (Exception e) {
            return ApiResponse.error("获取字典数据失败: " + e.getMessage());
        }
    }
}
