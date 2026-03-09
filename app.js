const classConfigs = {
  "Blood Knight": {},
  Necromancer: {},
  Cultist: {},
  Engineer: {},
};

const options = {
  dispelCategory: ["Magic", "Curse", "Melee", "Custom"],
  exclusiveCategory: ["Offensive", "Buff - Long", "Buff - Short", "Custom"],
  castingTime: ["Instant", "Normal (1.00s)", "Long (2.00s)", "Short (0.50s)", "Custom"],
  duration: ["None", "5 min", "10 min", "30 min", "60 min", "Custom"],
  particle: [
    "Spark",
    "Smoke",
    "Trail",
    "Fire",
    "Magic",
    "Dust",
    "Explosion",
    "Snow",
    "Rain",
    "Embers",
    "Stars",
    "Heal",
    "Poison",
    "Electric",
  ],
  screen: [
    "Screen Shake",
    "Screen Flash",
    "Hitstop",
    "Camera Punch",
    "Shockwave",
    "Slow Motion",
    "Vignette",
    "Letterbox",
  ],
  object: ["Flash", "Shake", "Squash & Stretch", "Highlight"],
  feedback: [
    "Floating Damage/Combat Numbers",
    "Announcements",
    "Toasts",
    "Page Outline Pulse",
  ],
  slashShapes: [
    "Tight Widening",
    "Tight Uniform",
    "Broad Widening",
    "Broad Uniform",
    "Crescent",
    "Long Crescent",
    "Circle",
  ],
  slashEdgeStyles: [
    "Edge Only",
    "Plain",
    "Faded Body",
    "Faded",
    "Body Only",
  ],
  slashNoise: ["None", "Forward", "Backward", "Stable Dissolve"],
  slashGlow: ["None", "Light", "Medium", "Intense", "Max"],
  slashTiming: ["Quick", "Standard", "Slow", "Very Slow"],
};

const classSelect = document.getElementById("classSelect");
const customClassField = document.getElementById("customClassField");
const customClassInput = document.getElementById("customClass");
const spellbarSlot = document.getElementById("spellbarSlot");
const spellbarCustomField = document.getElementById("spellbarCustomField");
const spellbarCustomInput = document.getElementById("spellbarCustom");
const spellbookChoice = document.getElementById("spellbookChoice");
const spellbookCustomField = document.getElementById("spellbookCustomField");
const spellbookCustomInput = document.getElementById("spellbookCustom");
const criteria = document.getElementById("criteria");
const outputText = document.getElementById("outputText");
const copyBtn = document.getElementById("copyBtn");
const savePresetBtn = document.getElementById("savePresetBtn");
const presetFile = document.getElementById("presetFile");
const validation = document.getElementById("validation");

const state = {
  className: "",
  customClassName: "",
  spellbarSlot: "",
  spellbarCustom: "",
  spellbookChoice: "",
  spellbookCustom: "",
  dispelCategory: "",
  dispelCategoryCustom: "",
  spellLevelCustom: "",
  exclusiveCategory: "",
  exclusiveCategoryCustom: "",
  castingTime: "",
  castingTimeCustom: "",
  durationCustom: "",
  spellNameMode: "",
  spellNameCustom: "",
  manaCost: "",
  cooldown: "",
  damage: "",
  interrupts: new Set(),
  vfx: {
    particle: "",
    screen: "",
    object: "",
    feedback: "",
    spellIconUrl: "",
  },
  slashVfx: {
    shape: "",
    edgeStyle: "",
    noise: "",
    glow: "",
    timing: "",
  },
  animationNameManual: "",
  notes: "",
};

const buildSelect = (id, label, list, includeNone = true) => {
  const field = document.createElement("label");
  field.className = "field";
  field.innerHTML = `
    <span class="field__label">${label}</span>
    <select id="${id}" class="field__control">
      <option value="" selected disabled>Select...</option>
      ${includeNone ? `<option value="None">None</option>` : ""}
      ${list.map((item) => `<option>${item}</option>`).join("")}
    </select>
  `;
  return field;
};

const buildTextInput = (id, label, placeholder = "") => {
  const field = document.createElement("label");
  field.className = "field";
  field.innerHTML = `
    <span class="field__label">${label}</span>
    <input id="${id}" class="field__control" type="text" placeholder="${placeholder}" />
  `;
  return field;
};

const buildNumberInput = (id, label, placeholder = "") => {
  const field = document.createElement("label");
  field.className = "field";
  field.innerHTML = `
    <span class="field__label">${label}</span>
    <input id="${id}" class="field__control" type="number" min="1" max="60" placeholder="${placeholder}" />
  `;
  return field;
};

const buildCheckboxes = (id, label, list) => {
  const wrapper = document.createElement("div");
  wrapper.className = "section";
  wrapper.innerHTML = `<h3>${label}</h3>`;
  const grid = document.createElement("div");
  grid.className = "checkboxes";
  list.forEach((item) => {
    const box = document.createElement("label");
    box.className = "checkbox";
    box.innerHTML = `
      <input type="checkbox" value="${item}" data-group="${id}" />
      <span>${item}</span>
    `;
    grid.appendChild(box);
  });
  wrapper.appendChild(grid);
  return wrapper;
};

const toggleField = (fieldId, isVisible) => {
  const input = document.getElementById(fieldId);
  if (!input) return;
  const field = input.closest(".field") || input;
  field.classList.toggle("is-hidden", !isVisible);
};

let animationNames = [];

const loadAnimations = async () => {
  const animationDatalist = document.getElementById("animationDatalist");
  if (!animationDatalist) return;

  const setStatus = (label) => {
    animationDatalist.innerHTML = `<option value="${label}"></option>`;
  };

  const populate = (names) => {
    animationNames = names;
    animationDatalist.innerHTML = names
      .map((name) => `<option value="${name}"></option>`)
      .join("");
  };

  const parseFromDocument = (doc) => {
    const tableRows = [...doc.querySelectorAll("table tr")];
    const fromTable = tableRows
      .map((row) => row.querySelectorAll("td")[1]?.textContent?.trim())
      .filter(Boolean);
    if (fromTable.length) return fromTable;

    return parseFromText(doc.body?.innerText || doc.body?.textContent || "");
  };

  const parseFromText = (text) => {
    const names = [];
    text.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.includes("|")) {
        const parts = trimmed
          .split("|")
          .map((part) => part.trim())
          .filter(Boolean);
        if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
          names.push(parts[1]);
        }
      } else {
        const match = trimmed.match(/^\s*\d+\s+([A-Za-z0-9_-]+)\s+\S+\s+\S+/);
        if (match) names.push(match[1]);
      }
    });
    return names;
  };

  const uniqueNames = (list) => {
    const seen = new Set();
    return list.filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  };

  setStatus("Loading animations...");

  const sources = [
    "https://docs.meshy.ai/api/animation-library",
    "https://docs.meshy.ai/en/api/animation-library",
    "https://r.jina.ai/http://docs.meshy.ai/api/animation-library",
    "https://r.jina.ai/http://docs.meshy.ai/en/api/animation-library",
    "https://r.jina.ai/http://https://docs.meshy.ai/api/animation-library",
    "https://r.jina.ai/http://https://docs.meshy.ai/en/api/animation-library",
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error("Fetch failed");
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const parsed = parseFromDocument(doc);
      const names = uniqueNames(parsed.length ? parsed : parseFromText(html));
      if (names.length > 0) {
        populate(names);
        return;
      }
    } catch (err) {
      // Try the next source.
    }
  }

  setStatus("Unable to load animations");
};

const renderCriteria = () => {
  criteria.innerHTML = "";

  const core = document.createElement("div");
  core.className = "section";
  core.innerHTML = `<h3>Core</h3>`;
  const coreRow = document.createElement("div");
  coreRow.className = "row";
  const dispelField = document.createElement("div");
  dispelField.className = "field";
  dispelField.innerHTML = `
    <span class="field__label">Dispel Category</span>
    <select id="dispelCategory" class="field__control">
      <option value="" selected disabled>Select...</option>
      ${options.dispelCategory.map((item) => `<option>${item}</option>`).join("")}
    </select>
  `;
  const dispelCustom = buildTextInput("dispelCategoryCustom", "Custom Dispel Category", "Enter custom category");
  dispelCustom.classList.add("is-hidden");

  const spellLevelCustom = buildNumberInput("spellLevelCustom", "Spell Level", "Enter a number");

  const exclusiveField = document.createElement("div");
  exclusiveField.className = "field";
  exclusiveField.innerHTML = `
    <span class="field__label">Exclusive Category</span>
    <select id="exclusiveCategory" class="field__control">
      <option value="" selected disabled>Select...</option>
      ${options.exclusiveCategory.map((item) => `<option>${item}</option>`).join("")}
    </select>
  `;
  const exclusiveCustom = buildTextInput("exclusiveCategoryCustom", "Custom Exclusive Category", "Enter custom category");
  exclusiveCustom.classList.add("is-hidden");

  const castingField = document.createElement("div");
  castingField.className = "field";
  castingField.innerHTML = `
    <span class="field__label">Casting Time</span>
    <select id="castingTime" class="field__control">
      <option value="" selected disabled>Select...</option>
      ${options.castingTime.map((item) => `<option>${item}</option>`).join("")}
    </select>
  `;
  const castingCustom = buildTextInput("castingTimeCustom", "Custom Casting Time", "Describe casting time");
  castingCustom.classList.add("is-hidden");

  const durationCustom = buildTextInput("durationCustom", "Duration", "e.g. None, 30 min, 2 hours");

  coreRow.appendChild(dispelField);
  coreRow.appendChild(spellLevelCustom);
  coreRow.appendChild(exclusiveField);
  coreRow.appendChild(castingField);
  coreRow.appendChild(durationCustom);
  core.appendChild(coreRow);
  core.appendChild(dispelCustom);
  core.appendChild(exclusiveCustom);
  core.appendChild(castingCustom);

  const coreRowTwo = document.createElement("div");
  coreRowTwo.className = "row";
  const spellNameField = document.createElement("div");
  spellNameField.className = "field";
  spellNameField.innerHTML = `
    <span class="field__label">Spell Name</span>
    <select id="spellNameMode" class="field__control">
      <option value="" selected disabled>Select...</option>
      <option>Custom</option>
      <option>Ask Savi</option>
    </select>
  `;
  const spellNameCustom = buildTextInput("spellNameCustom", "Custom Spell Name", "Enter spell name");
  spellNameCustom.classList.add("is-hidden");
  coreRowTwo.appendChild(spellNameField);
  coreRowTwo.appendChild(buildTextInput("manaCost", "Mana Cost", "e.g. 25 or 40 mana"));
  coreRowTwo.appendChild(buildTextInput("cooldown", "Cooldown", "e.g. 10s or 2 min"));
  coreRowTwo.appendChild(buildTextInput("damage", "Damage (Number or Range)", "e.g. 120 or 80-140"));
  core.appendChild(coreRowTwo);
  core.appendChild(spellNameCustom);

  const interrupts = document.createElement("div");
  interrupts.className = "section";
  interrupts.innerHTML = `
    <h3>Interrupts</h3>
    <div class="field dropdown">
      <span class="field__label">Interrupts</span>
      <button id="interruptsToggle" class="field__control dropdown__toggle" type="button">
        Select interrupts
      </button>
      <div id="interruptsMenu" class="dropdown__menu">
        <label class="dropdown__item">
          <input type="checkbox" value="None" data-group="interrupts" />
          <span>None</span>
        </label>
        <label class="dropdown__item">
          <input type="checkbox" value="Casting" data-group="interrupts" />
          <span>Casting</span>
        </label>
        <label class="dropdown__item">
          <input type="checkbox" value="Movement" data-group="interrupts" />
          <span>Movement</span>
        </label>
        <label class="dropdown__item">
          <input type="checkbox" value="Combat" data-group="interrupts" />
          <span>Combat</span>
        </label>
        <label class="dropdown__item">
          <input type="checkbox" value="Damage" data-group="interrupts" />
          <span>Damage</span>
        </label>
        <label class="dropdown__item">
          <input type="checkbox" value="Stun" data-group="interrupts" />
          <span>Stun</span>
        </label>
      </div>
    </div>
  `;

  const vfx = document.createElement("div");
  vfx.className = "section";
  vfx.innerHTML = `<h3>VFX</h3>`;
  const vfxRow = document.createElement("div");
  vfxRow.className = "row";
  vfxRow.appendChild(buildSelect("vfxParticle", "Particle Effects", options.particle));
  vfxRow.appendChild(buildSelect("vfxScreen", "Screen Effects", options.screen));
  vfxRow.appendChild(buildSelect("vfxObject", "Object Effects", options.object));
  vfxRow.appendChild(buildSelect("vfxFeedback", "Feedback", options.feedback));
  vfx.appendChild(vfxRow);
  const iconRow = document.createElement("div");
  iconRow.className = "row row--icon";
  const iconField = buildTextInput(
    "spellIconUrl",
    "Spell Icon URL",
    "https://raw.githubusercontent.com/user/repo/main/icon.png"
  );
  const iconPreview = document.createElement("div");
  iconPreview.className = "icon-preview";
  iconPreview.innerHTML = `
    <span class="field__label">Preview</span>
    <div class="icon-preview__frame">
      <img id="spellIconPreview" alt="Spell icon preview" />
      <span class="icon-preview__empty">No icon loaded</span>
    </div>
  `;
  iconRow.appendChild(iconField);
  iconRow.appendChild(iconPreview);
  vfx.appendChild(iconRow);

  const slash = document.createElement("div");
  slash.className = "section";
  slash.innerHTML = `<h3>Slash VFX</h3>`;
  const slashRow = document.createElement("div");
  slashRow.className = "row";
  slashRow.appendChild(buildSelect("slashShape", "Shapes", options.slashShapes, false));
  slashRow.appendChild(buildSelect("slashEdgeStyle", "Edge & Body Style", options.slashEdgeStyles, false));
  slashRow.appendChild(buildSelect("slashNoise", "Noise Animation", options.slashNoise, false));
  slashRow.appendChild(buildSelect("slashGlow", "Glow Level", options.slashGlow, false));
  slashRow.appendChild(buildSelect("slashTiming", "Timing", options.slashTiming, false));
  slash.appendChild(slashRow);

  const animation = document.createElement("div");
  animation.className = "section";
  animation.innerHTML = `
    <h3>All animations</h3>
    <div class="row">
      <label class="field">
        <span class="field__label">Animation (Type To Search)</span>
        <input id="animationManual" class="field__control" type="text" placeholder="Start typing animation name" list="animationDatalist" />
        <datalist id="animationDatalist"></datalist>
      </label>
    </div>
    <span class="helper">
      Source: <a href="https://docs.meshy.ai/en/api/animation-library" target="_blank" rel="noreferrer">Meshy Animation Library</a>
    </span>
  `;

  const notes = document.createElement("div");
  notes.className = "section";
  notes.innerHTML = `
    <h3>Additional Notes</h3>
    <label class="field">
      <span class="field__label">Other Considerations</span>
      <textarea id="notes" class="field__control" rows="3" placeholder="Add any extra constraints or flavor here..."></textarea>
    </label>
  `;

  criteria.appendChild(core);
  criteria.appendChild(interrupts);
  criteria.appendChild(vfx);
  criteria.appendChild(slash);
  criteria.appendChild(animation);
  criteria.appendChild(notes);

  criteria.querySelectorAll("select, input, textarea").forEach((el) => {
    el.addEventListener("input", handleInputChange);
    el.addEventListener("change", handleInputChange);
  });

  const interruptsToggle = document.getElementById("interruptsToggle");
  const interruptsMenu = document.getElementById("interruptsMenu");
  if (interruptsToggle && interruptsMenu) {
    interruptsToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      interruptsMenu.classList.toggle("is-open");
    });
    const closeMenu = (event) => {
      if (!interruptsMenu.contains(event.target) && event.target !== interruptsToggle) {
        interruptsMenu.classList.remove("is-open");
      }
    };
    document.addEventListener("click", closeMenu);
    criteria.addEventListener("focusin", closeMenu);
    // closeMenu handles outside clicks and focus changes
  }

  const preview = document.getElementById("spellIconPreview");
  const empty = document.querySelector(".icon-preview__empty");
  if (preview && empty) {
    preview.addEventListener("error", () => {
      preview.removeAttribute("src");
      preview.classList.remove("is-visible");
      empty.classList.remove("is-hidden");
    });
  }

  loadAnimations();
};

const handleInputChange = (event) => {
  const { id, value, type, checked, dataset } = event.target;

  if (id === "spellbarSlot") {
    state.spellbarSlot = value;
    const showCustom = value === "Custom";
    spellbarCustomField.classList.toggle("is-hidden", !showCustom);
    if (!showCustom) {
      spellbarCustomInput.value = "";
      state.spellbarCustom = "";
    }
    updateOutput();
    return;
  }
  if (id === "spellbarCustom") {
    state.spellbarCustom = value.trim();
    updateOutput();
    return;
  }
  if (id === "spellbookChoice") {
    state.spellbookChoice = value;
    const showCustom = value === "Custom";
    spellbookCustomField.classList.toggle("is-hidden", !showCustom);
    if (!showCustom) {
      spellbookCustomInput.value = "";
      state.spellbookCustom = "";
    }
    updateOutput();
    return;
  }
  if (id === "spellbookCustom") {
    state.spellbookCustom = value.trim();
    updateOutput();
    return;
  }

  if (type === "checkbox" && dataset.group === "interrupts") {
    if (checked) {
      if (value === "None") {
        state.interrupts = new Set(["None"]);
        const menu = document.getElementById("interruptsMenu");
        if (menu) {
          menu.querySelectorAll('input[type="checkbox"]').forEach((box) => {
            if (box.value !== "None") box.checked = false;
          });
        }
      } else {
        state.interrupts.delete("None");
        state.interrupts.add(value);
      }
    } else {
      state.interrupts.delete(value);
    }
    const toggle = document.getElementById("interruptsToggle");
    if (toggle) {
      const items = [...state.interrupts].filter((item) => item !== "None");
      toggle.textContent = items.length ? items.join(", ") : "Select interrupts";
    }
  } else if (id === "dispelCategory") {
    state.dispelCategory = value;
    toggleField("dispelCategoryCustom", value === "Custom");
    if (value !== "Custom") {
      state.dispelCategoryCustom = "";
      const input = document.getElementById("dispelCategoryCustom");
      if (input) input.value = "";
    }
  } else if (id === "dispelCategoryCustom") {
    state.dispelCategoryCustom = value.trim();
  } else if (id === "spellLevelCustom") {
    state.spellLevelCustom = value;
  } else if (id === "exclusiveCategory") {
    state.exclusiveCategory = value;
    toggleField("exclusiveCategoryCustom", value === "Custom");
    if (value !== "Custom") {
      state.exclusiveCategoryCustom = "";
      const input = document.getElementById("exclusiveCategoryCustom");
      if (input) input.value = "";
    }
  } else if (id === "exclusiveCategoryCustom") {
    state.exclusiveCategoryCustom = value.trim();
  } else if (id === "castingTime") {
    state.castingTime = value;
    toggleField("castingTimeCustom", value === "Custom");
    if (value !== "Custom") {
      state.castingTimeCustom = "";
      const input = document.getElementById("castingTimeCustom");
      if (input) input.value = "";
    }
  } else if (id === "castingTimeCustom") {
    state.castingTimeCustom = value.trim();
  } else if (id === "durationCustom") {
    state.durationCustom = value.trim();
  } else if (id === "spellNameMode") {
    state.spellNameMode = value;
    toggleField("spellNameCustom", value === "Custom");
    if (value !== "Custom") {
      state.spellNameCustom = "";
      const input = document.getElementById("spellNameCustom");
      if (input) input.value = "";
    }
  } else if (id === "spellNameCustom") {
    state.spellNameCustom = value.trim();
  } else if (id === "manaCost") {
    state.manaCost = value.trim();
  } else if (id === "cooldown") {
    state.cooldown = value.trim();
  } else if (id === "damage") {
    state.damage = value.trim();
  }
  else if (id === "vfxParticle") state.vfx.particle = value;
  else if (id === "vfxScreen") state.vfx.screen = value;
  else if (id === "vfxObject") state.vfx.object = value;
  else if (id === "vfxFeedback") state.vfx.feedback = value;
  else if (id === "spellIconUrl") {
    state.vfx.spellIconUrl = value.trim();
    const preview = document.getElementById("spellIconPreview");
    const empty = document.querySelector(".icon-preview__empty");
    if (preview && empty) {
      if (state.vfx.spellIconUrl) {
        preview.src = state.vfx.spellIconUrl;
        preview.classList.add("is-visible");
        empty.classList.add("is-hidden");
      } else {
        preview.removeAttribute("src");
        preview.classList.remove("is-visible");
        empty.classList.remove("is-hidden");
      }
    }
  }
  else if (id === "slashShape") state.slashVfx.shape = value;
  else if (id === "slashEdgeStyle") state.slashVfx.edgeStyle = value;
  else if (id === "slashNoise") state.slashVfx.noise = value;
  else if (id === "slashGlow") state.slashVfx.glow = value;
  else if (id === "slashTiming") state.slashVfx.timing = value;
  else if (id === "animationManual") {
    state.animationNameManual = value.trim();
  }
  else if (id === "notes") state.notes = value.trim();

  updateOutput();
};

const validateLevel = () => {
  if (!state.spellLevelCustom) {
    return true;
  }
  const level = Number(state.spellLevelCustom);
  if (Number.isNaN(level) || level < 1 || level > 60) {
    return false;
  }
  return true;
};

const normalizeExclusive = (value) => {
  if (!value) return "";
  if (value === "Buff - Long") return "a long buff";
  if (value === "Buff - Short") return "a short buff";
  if (value === "Offensive") return "an offensive spell";
  return value;
};

const addIfSelected = (label, value) => {
  if (!value || value === "None") return null;
  return `${label}: ${value}`;
};

const getSelectionCount = () => {
  let count = 0;
  if (state.dispelCategory && state.dispelCategory !== "Custom") count += 1;
  if (state.dispelCategory === "Custom" && state.dispelCategoryCustom) count += 1;
  if (state.spellLevelCustom && validateLevel()) count += 1;
  if (state.spellNameMode === "Ask Savi") count += 1;
  if (state.spellNameMode === "Custom" && state.spellNameCustom) count += 1;
  if (state.manaCost) count += 1;
  if (state.cooldown) count += 1;
  if (state.damage) count += 1;
  if (state.exclusiveCategory && state.exclusiveCategory !== "Custom") count += 1;
  if (state.exclusiveCategory === "Custom" && state.exclusiveCategoryCustom) count += 1;
  if (state.castingTime && state.castingTime !== "Custom") count += 1;
  if (state.castingTime === "Custom" && state.castingTimeCustom) count += 1;
  if (state.durationCustom) count += 1;
  if (state.interrupts.size > 0 && !state.interrupts.has("None")) count += 1;
  if (state.vfx.particle && state.vfx.particle !== "None") count += 1;
  if (state.vfx.screen && state.vfx.screen !== "None") count += 1;
  if (state.vfx.object && state.vfx.object !== "None") count += 1;
  if (state.vfx.feedback && state.vfx.feedback !== "None") count += 1;
  if (state.vfx.spellIconUrl) count += 1;
  if (state.slashVfx.shape && state.slashVfx.shape !== "None") count += 1;
  if (state.slashVfx.edgeStyle && state.slashVfx.edgeStyle !== "None") count += 1;
  if (state.slashVfx.noise && state.slashVfx.noise !== "None") count += 1;
  if (state.slashVfx.glow && state.slashVfx.glow !== "None") count += 1;
  if (state.slashVfx.timing && state.slashVfx.timing !== "None") count += 1;
  if (state.animationNameManual) count += 1;
  if (state.notes) count += 1;
  return count;
};

const updateOutput = () => {
  const levelValid = validateLevel();
  const lines = [];

  if (!state.className) {
    outputText.value = "";
    validation.textContent = "";
    return;
  }

  const selectionCount = getSelectionCount();
  const errors = [];

  if (!levelValid) {
    errors.push("Spell level must be between 1 and 60.");
  }
  if (selectionCount < 3) {
    errors.push(`Select at least 3 criteria to generate output. (${selectionCount}/3 selected)`);
  }

  validation.textContent = errors.join(" ");

  if (errors.length > 0) {
    outputText.value = "";
    return;
  }

  const dispelCategory =
    state.dispelCategory === "Custom"
      ? state.dispelCategoryCustom
      : state.dispelCategory;
  const exclusiveBase =
    state.exclusiveCategory === "Custom"
      ? state.exclusiveCategoryCustom
      : state.exclusiveCategory;
  const exclusive = normalizeExclusive(exclusiveBase);
  const castingTime =
    state.castingTime === "Custom" ? state.castingTimeCustom : state.castingTime;
  const duration = state.durationCustom;
  const sentenceParts = [`For the ${state.className} class, create`];
  sentenceParts.push(exclusive || "a spell");

  if (dispelCategory) {
    const dispelText =
      state.dispelCategory === "Custom"
        ? dispelCategory
        : dispelCategory.toLowerCase();
    sentenceParts.push(`with dispel category ${dispelText}`);
  }
  if (state.spellLevelCustom && levelValid) {
    sentenceParts.push(`at spell level ${state.spellLevelCustom}`);
  }
  lines.push(`${sentenceParts.join(" ")}.`);

  if (castingTime) {
    lines.push(`Casting time: ${castingTime}.`);
  }
  if (duration) {
    lines.push(`Duration: ${duration}.`);
  }

  if (state.spellNameMode === "Custom" && state.spellNameCustom) {
    lines.push(`Spell name: ${state.spellNameCustom}.`);
  } else if (state.spellNameMode === "Ask Savi") {
    lines.push("Please make a name for the spell.");
  }

  if (state.manaCost) {
    lines.push(`Mana cost: ${state.manaCost}.`);
  }
  if (state.cooldown) {
    lines.push(`Cooldown: ${state.cooldown}.`);
  }
  if (state.damage) {
    lines.push(`Damage: ${state.damage}.`);
  }

  if (state.spellbarSlot) {
    const slot =
      state.spellbarSlot === "Custom" ? state.spellbarCustom : state.spellbarSlot;
    if (slot) {
      lines.push(`Spellbar slot: ${slot}.`);
    }
  }
  if (state.spellbookChoice) {
    const spellbook =
      state.spellbookChoice === "Custom"
        ? state.spellbookCustom
        : state.spellbookChoice;
    if (spellbook) {
      lines.push(`Add to spellbook: ${spellbook}.`);
    }
  }

  if (state.interrupts.size > 0 && !state.interrupts.has("None")) {
    lines.push(`Interrupts: ${[...state.interrupts].filter((item) => item !== "None").join(", ")}.`);
  }

  const vfxBits = [
    addIfSelected("Particle Effects", state.vfx.particle),
    state.vfx.spellIconUrl ? `Spell icon: ${state.vfx.spellIconUrl}` : null,
    addIfSelected("Screen Effects", state.vfx.screen),
    addIfSelected("Object Effects", state.vfx.object),
    addIfSelected("Feedback", state.vfx.feedback),
  ].filter(Boolean);
  if (vfxBits.length) {
    lines.push(`VFX: ${vfxBits.join("; ")}.`);
  }

  const slashBits = [
    addIfSelected("Shape", state.slashVfx.shape),
    addIfSelected("Edge & Body", state.slashVfx.edgeStyle),
    addIfSelected("Noise", state.slashVfx.noise),
    addIfSelected("Glow", state.slashVfx.glow),
    addIfSelected("Timing", state.slashVfx.timing),
  ].filter(Boolean);
  if (slashBits.length) {
    lines.push(`Slash VFX: ${slashBits.join("; ")}.`);
  }

  const animationName = state.animationNameManual;
  if (animationName) {
    lines.push(`Casting animation: ${animationName}.`);
    lines.push(
      "Then add that animation in addition to all of the default animations as well as all of the other ones we have added so far."
    );
  }

  if (state.notes) {
    lines.push(`Additional considerations: ${state.notes}.`);
  }

  lines.push(
    "You only need to give the animations to the races that have the class available (not all races)."
  );
  lines.push("Ultrathink.");

  outputText.value = lines.join(" ");
};

const handleClassChange = (event) => {
  const className = event.target.value;
  state.className = className === "__custom__" ? state.customClassName : className;

  if (className === "__custom__") {
    customClassField.classList.remove("is-hidden");
  } else {
    customClassField.classList.add("is-hidden");
    customClassInput.value = "";
    state.customClassName = "";
  }

  if (
    className &&
    className !== "None" &&
    (classConfigs[className] !== undefined || className === "__custom__")
  ) {
    state.spellbarSlot = "";
    state.spellbarCustom = "";
    state.spellbookChoice = "";
    state.spellbookCustom = "";
    state.dispelCategory = "";
    state.dispelCategoryCustom = "";
    state.spellLevelCustom = "";
    state.spellNameMode = "";
    state.spellNameCustom = "";
    state.manaCost = "";
    state.cooldown = "";
    state.damage = "";
    state.exclusiveCategory = "";
    state.exclusiveCategoryCustom = "";
    state.castingTime = "";
    state.castingTimeCustom = "";
    state.durationCustom = "";
    state.interrupts = new Set();
    state.vfx = {
      particle: "",
      screen: "",
      object: "",
      feedback: "",
      spellIconUrl: "",
    };
    state.slashVfx = {
      shape: "",
      edgeStyle: "",
      noise: "",
      glow: "",
      timing: "",
    };
    state.animationNameManual = "";
    state.notes = "";
    criteria.classList.remove("is-hidden");
    renderCriteria();
    updateOutput();
  } else {
    criteria.classList.add("is-hidden");
    outputText.value = "";
    validation.textContent = "";
  }
};

const handleCopy = async () => {
  if (!outputText.value.trim()) return;
  try {
    await navigator.clipboard.writeText(outputText.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy to clipboard";
    }, 1400);
  } catch (err) {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy to clipboard";
    }, 1400);
  }
};

const buildPreset = () => ({
  version: 1,
  className: state.className,
  customClassName: state.customClassName,
  spellbarSlot: state.spellbarSlot,
  spellbarCustom: state.spellbarCustom,
  spellbookChoice: state.spellbookChoice,
  spellbookCustom: state.spellbookCustom,
  dispelCategory: state.dispelCategory,
  dispelCategoryCustom: state.dispelCategoryCustom,
  spellLevelCustom: state.spellLevelCustom,
  spellNameMode: state.spellNameMode,
  spellNameCustom: state.spellNameCustom,
  manaCost: state.manaCost,
  cooldown: state.cooldown,
  damage: state.damage,
  exclusiveCategory: state.exclusiveCategory,
  exclusiveCategoryCustom: state.exclusiveCategoryCustom,
  castingTime: state.castingTime,
  castingTimeCustom: state.castingTimeCustom,
  durationCustom: state.durationCustom,
  interrupts: [...state.interrupts],
  vfx: { ...state.vfx },
  slashVfx: { ...state.slashVfx },
  animationNameManual: state.animationNameManual,
  notes: state.notes,
});

const applyPreset = (preset) => {
  if (!preset || typeof preset !== "object") return;

  const classValue = preset.className || "";
  if (classValue) {
    classSelect.value =
      classValue === "None" || classConfigs[classValue] !== undefined
        ? classValue
        : "__custom__";
    customClassInput.value =
      classConfigs[classValue] !== undefined ? "" : classValue;
    customClassField.classList.toggle("is-hidden", classSelect.value !== "__custom__");
    state.className = classValue;
    state.customClassName = customClassInput.value.trim();
  }

  if (classSelect.value && classSelect.value !== "None") {
    criteria.classList.remove("is-hidden");
    renderCriteria();
  }

  spellbarSlot.value = preset.spellbarSlot || "";
  state.spellbarSlot = spellbarSlot.value;
  spellbarCustomInput.value = preset.spellbarCustom || "";
  state.spellbarCustom = spellbarCustomInput.value.trim();
  spellbarCustomField.classList.toggle(
    "is-hidden",
    spellbarSlot.value !== "Custom"
  );

  spellbookChoice.value = preset.spellbookChoice || "";
  state.spellbookChoice = spellbookChoice.value;
  spellbookCustomInput.value = preset.spellbookCustom || "";
  state.spellbookCustom = spellbookCustomInput.value.trim();
  spellbookCustomField.classList.toggle(
    "is-hidden",
    spellbookChoice.value !== "Custom"
  );

  const setField = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  };

  setField("dispelCategory", preset.dispelCategory);
  state.dispelCategory = preset.dispelCategory || "";
  setField("dispelCategoryCustom", preset.dispelCategoryCustom);
  state.dispelCategoryCustom = preset.dispelCategoryCustom || "";
  toggleField("dispelCategoryCustom", state.dispelCategory === "Custom");

  setField("spellLevelCustom", preset.spellLevelCustom);
  state.spellLevelCustom = preset.spellLevelCustom || "";

  setField("spellNameMode", preset.spellNameMode);
  state.spellNameMode = preset.spellNameMode || "";
  setField("spellNameCustom", preset.spellNameCustom);
  state.spellNameCustom = preset.spellNameCustom || "";
  toggleField("spellNameCustom", state.spellNameMode === "Custom");

  setField("manaCost", preset.manaCost);
  state.manaCost = preset.manaCost || "";
  setField("cooldown", preset.cooldown);
  state.cooldown = preset.cooldown || "";
  setField("damage", preset.damage);
  state.damage = preset.damage || "";

  setField("exclusiveCategory", preset.exclusiveCategory);
  state.exclusiveCategory = preset.exclusiveCategory || "";
  setField("exclusiveCategoryCustom", preset.exclusiveCategoryCustom);
  state.exclusiveCategoryCustom = preset.exclusiveCategoryCustom || "";
  toggleField("exclusiveCategoryCustom", state.exclusiveCategory === "Custom");

  setField("castingTime", preset.castingTime);
  state.castingTime = preset.castingTime || "";
  setField("castingTimeCustom", preset.castingTimeCustom);
  state.castingTimeCustom = preset.castingTimeCustom || "";
  toggleField("castingTimeCustom", state.castingTime === "Custom");

  setField("durationCustom", preset.durationCustom);
  state.durationCustom = preset.durationCustom || "";

  state.interrupts = new Set(preset.interrupts || []);
  const interruptsMenu = document.getElementById("interruptsMenu");
  if (interruptsMenu) {
    interruptsMenu.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = state.interrupts.has(box.value);
    });
  }
  const interruptsToggle = document.getElementById("interruptsToggle");
  if (interruptsToggle) {
    const items = [...state.interrupts].filter((item) => item !== "None");
    interruptsToggle.textContent = items.length ? items.join(", ") : "Select interrupts";
  }

  state.vfx = { ...state.vfx, ...(preset.vfx || {}) };
  setField("vfxParticle", state.vfx.particle);
  setField("vfxScreen", state.vfx.screen);
  setField("vfxObject", state.vfx.object);
  setField("vfxFeedback", state.vfx.feedback);
  setField("spellIconUrl", state.vfx.spellIconUrl);
  const preview = document.getElementById("spellIconPreview");
  const empty = document.querySelector(".icon-preview__empty");
  if (preview && empty) {
    if (state.vfx.spellIconUrl) {
      preview.src = state.vfx.spellIconUrl;
      preview.classList.add("is-visible");
      empty.classList.add("is-hidden");
    } else {
      preview.removeAttribute("src");
      preview.classList.remove("is-visible");
      empty.classList.remove("is-hidden");
    }
  }

  state.slashVfx = { ...state.slashVfx, ...(preset.slashVfx || {}) };
  setField("slashShape", state.slashVfx.shape);
  setField("slashEdgeStyle", state.slashVfx.edgeStyle);
  setField("slashNoise", state.slashVfx.noise);
  setField("slashGlow", state.slashVfx.glow);
  setField("slashTiming", state.slashVfx.timing);

  state.animationNameManual = preset.animationNameManual || "";
  setField("animationManual", state.animationNameManual);

  state.notes = preset.notes || "";
  setField("notes", state.notes);

  updateOutput();
};

const handleSavePreset = () => {
  const preset = buildPreset();
  const blob = new Blob([JSON.stringify(preset, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "spell-preset.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const handleLoadPreset = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const preset = JSON.parse(reader.result);
      applyPreset(preset);
    } catch (err) {
      validation.textContent = "Invalid preset file.";
    }
  };
  reader.readAsText(file);
  event.target.value = "";
};

classSelect.addEventListener("change", handleClassChange);
spellbarSlot.addEventListener("change", handleInputChange);
spellbarCustomInput.addEventListener("input", handleInputChange);
spellbookChoice.addEventListener("change", handleInputChange);
spellbookCustomInput.addEventListener("input", handleInputChange);
customClassInput.addEventListener("input", (event) => {
  state.customClassName = event.target.value.trim();
  if (classSelect.value === "__custom__") {
    state.className = state.customClassName;
    updateOutput();
  }
});
copyBtn.addEventListener("click", handleCopy);
savePresetBtn.addEventListener("click", handleSavePreset);
presetFile.addEventListener("change", handleLoadPreset);
