'use strict';

const { clipboard } = require('electron');

module.exports = {
  async load() {
    console.log('[copy-node-path] 插件已加载');
  },

  async unload() {
    console.log('[copy-node-path] 插件已卸载');
  },

  methods: {
    async copySelectedNodePath() {
      try {
        const uuids = Editor.Selection.getSelected('node');

        if (!uuids || uuids.length === 0) {
          console.warn('[copy-node-path] 请先在层级管理器中选中一个节点');
          return;
        }

        const uuid = uuids[0];

        const path = await getNodePath(uuid);

        if (!path) {
          console.warn('[copy-node-path] 获取节点路径失败');
          return;
        }

        clipboard.writeText(path);

        console.log(`[copy-node-path] 已复制节点路径: ${path}`);
      } catch (error) {
        console.error('[copy-node-path] 执行失败:', error);
      }
    }
  }
};

async function getNodePath(uuid) {
  const names = [];

  let currentUuid = uuid;

  while (currentUuid) {
    const nodeDump = await Editor.Message.request('scene', 'query-node', currentUuid);

    if (!nodeDump) {
      break;
    }

    const nodeName = getValue(nodeDump.name);
    names.unshift(nodeName);

    const parentUuid = getValue(nodeDump.parent);

    if (!parentUuid) {
      break;
    }

    currentUuid = parentUuid;
  }

  return names.join('/');
}

function getValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}