package com.beiguo.dto.admin;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class PermissionTreeNode {
    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private Boolean isPage;
    private String type; // ROOT/MENU/PAGE/FUNCTION
    private Integer orderNum;
    private String icon;
    private String routePath;
    private Boolean isDeletable;
    private List<PermissionTreeNode> children = new ArrayList<>();
    private boolean checked;
}
