package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageOperationDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentCreateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentPage;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentUpdateDTO;
import cn.tannn.cat.block.entity.PythonEnvironment;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Python环境Service接口
 *
 * @author tnnn
 */
public interface PythonEnvironmentService {

    /**
     * 创建环境
     *
     * @param createDTO 创建DTO
     * @return Python环境
     */
    PythonEnvironment create(PythonEnvironmentCreateDTO createDTO);

    /**
     * 更新环境
     *
     * @param updateDTO 更新DTO
     * @return Python环境
     */
    PythonEnvironment update(PythonEnvironmentUpdateDTO updateDTO);

    /**
     * 删除环境
     *
     * @param id 环境ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询环境
     *
     * @param id 环境ID
     * @return Python环境
     */
    PythonEnvironment getById(Integer id);

    /**
     * 根据名称查询环境
     *
     * @param name 环境名称
     * @return Python环境
     */
    PythonEnvironment getByName(String name);

    /**
     * 获取所有环境
     *
     * @return Python环境列表
     */
    List<PythonEnvironment> listAll();


    /**
     * 分页查询执行历史（使用查询条件）
     *
     * @param where 分页参数和查询条件
     * @return Python环境分页列表
     */
    Page<PythonEnvironment> findPage(PythonEnvironmentPage where);


    /**
     * 搜索环境（名称或描述包含关键字）
     *
     * @param keyword 关键字
     * @return Python环境列表
     */
    List<PythonEnvironment> search(String keyword);

    /**
     * 获取默认环境
     *
     * @return Python环境
     */
    PythonEnvironment getDefaultEnvironment();

    /**
     * 设置默认环境
     *
     * @param id 环境ID
     * @return Python环境
     */
    PythonEnvironment setAsDefault(Integer id);

    /**
     * 安装包
     *
     * @param id         环境ID
     * @param packageDTO 包操作DTO
     * @return Python环境
     */
    PythonEnvironment installPackage(Integer id, PackageOperationDTO packageDTO);

    /**
     * 卸载包
     *
     * @param id          环境ID
     * @param packageName 包名
     * @return Python环境
     */
    PythonEnvironment uninstallPackage(Integer id, String packageName);

    /**
     * 导出环境依赖（requirements.txt格式）
     *
     * @param id 环境ID
     * @return 依赖文本
     */
    String exportRequirements(Integer id);

    /**
     * 导入环境依赖
     *
     * @param id               环境ID
     * @param requirementsText 依赖文本
     * @return Python环境
     */
    PythonEnvironment importRequirements(Integer id, String requirementsText);
}
