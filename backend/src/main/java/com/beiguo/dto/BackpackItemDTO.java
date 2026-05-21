package com.beiguo.dto;

import lombok.Data;

@Data
public class BackpackItemDTO {
    private String category;
    private String itemName;
    private String itemIcon;
    private Integer quantity;
    private String expireTime;
    private String numberOrDate;
}
