package com.beiguo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // 静态资源存储目录（相对于项目根目录）
    private static final String STATIC_RESOURCES_DIR = "static-resources";
    // 访问静态资源的 URL 前缀
    private static final String STATIC_RESOURCES_PATH = "/static/**";

    @Autowired
    private OnlineStatusInterceptor onlineStatusInterceptor;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 获取项目根目录下的 static-resources 文件夹的绝对路径
        String projectRoot = System.getProperty("user.dir");
        String absolutePath = projectRoot + "/" + STATIC_RESOURCES_DIR + "/";

        // 确保目录存在
        Path resourcePath = Paths.get(absolutePath);
        if (!resourcePath.toFile().exists()) {
            resourcePath.toFile().mkdirs();
        }

        // 配置静态资源映射
        // 访问 /static/** 会映射到 项目的 static-resources/ 目录
        registry.addResourceHandler(STATIC_RESOURCES_PATH)
                .addResourceLocations("file:" + absolutePath);

        System.out.println("[静态资源配置] 资源目录: " + absolutePath);
        System.out.println("[静态资源配置] 访问路径: http://localhost:8080/static/...");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(onlineStatusInterceptor)
                .addPathPatterns("/admin/**")
                .excludePathPatterns(
                        "/admin/auth/login",
                        "/admin/auth/logout"
                );
    }
}
