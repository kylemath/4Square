// 4square skin registry: each skins/<id>.js calls FTH_SKINS.register(spec). See SKIN-SPEC.md.
(function () {
  const list = [];
  window.FTH_SKINS = {
    list,
    register(spec) {
      if (!spec || !spec.id || !spec.name) throw new Error('skin spec needs id and name');
      const i = list.findIndex(s => s.id === spec.id);
      if (i >= 0) list[i] = spec; else list.push(spec);
    },
    get(id) { return list.find(s => s.id === id) || list[0]; },
  };
})();
