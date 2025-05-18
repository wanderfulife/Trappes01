<template>
  <div class="app-container">
    <!-- Progress Bar -->
    <div v-if="currentStep === 'survey'" class="progress-bar">
      <div class="progress" :style="{ width: `${progress}%` }"></div>
    </div>

    <div class="content-container">
      <!-- Enqueteur Input Step -->
      <div v-if="currentStep === 'enqueteur'">
        <h2>Prénom enqueteur :</h2>
        <input class="form-control" type="text" v-model="enqueteur" />
        <button
          v-if="enqueteur && !isEnqueteurSaved"
          @click="setEnqueteur"
          class="btn-next"
        >
          Suivant
        </button>
      </div>

      <!-- Start Survey Step -->
      <div v-else-if="currentStep === 'start'" class="start-survey-container">
        <h2>
          Bonjour,<br />
          pour mieux connaître les usagers<br />
          de la gare de Trappes,<br /><br />
          Saint Quentin en Yveline et Ile de France Mobilités<br>
          souhaiteraient en savoir plus sur votre déplacement en cours.<br>
          Auriez-vous 2 minutes à nous accorder ?
        </h2>
        <button @click="startSurvey" class="btn-next">
          COMMENCER QUESTIONNAIRE
        </button>
      </div>

      <!-- Survey Questions Step -->
      <div v-else-if="currentStep === 'survey' && !isSurveyComplete">
        <div class="question-container">
          <h2>{{ currentQuestion.text }}</h2>



          <!-- Commune Selector for Q2 and Q6 -->
          <div v-if="currentQuestion.id === 'Q2'">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
            >
              <button @click="selectAnswer(option, index)" class="btn-option">
                {{ option.text }}
              </button>
            </div>
          </div>
          <div
            v-else-if="
              currentQuestion.id === 'Q3a_precision' ||
              currentQuestion.id === 'Q3b_precision'
            "
          >
            <CommuneSelector
              v-model="selectedCommune"
              v-model:postalCodePrefix="postalCodePrefix"
            />
            <p>Commune sélectionnée ou saisie: {{ selectedCommune }}</p>
            <button
              @click="handleCommuneSelection"
              class="btn-next"
              :disabled="!selectedCommune.trim()"
            >
              {{ isLastQuestion ? "Terminer" : "Suivant" }}
            </button>
          </div>

          <!-- Street Input -->
          <div v-else-if="currentQuestion.streetInput">
            <div class="input-container">
              <input
                v-model="streetInput"
                class="form-control"
                type="text"
                :placeholder="
                  currentQuestion.freeTextPlaceholder || 'Saisissez une rue'
                "
              />
              <ul v-if="showFilteredStreets" class="commune-dropdown">
                <li
                  v-for="street in filteredStreets"
                  :key="street"
                  @click="selectStreet(street)"
                  class="commune-option"
                >
                  {{ street }}
                </li>
              </ul>
            </div>
            <button
              @click="handleStreetSelection"
              class="btn-next"
              :disabled="!streetInput.trim()"
            >
              {{ isLastQuestion ? "Terminer" : "Suivant" }}
            </button>
          </div>
          <!-- Multiple Choice Questions -->
          <div
            v-else-if="
              !currentQuestion.freeText && !currentQuestion.usesGareSelector
            "
          >
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
            >
              <button @click="selectAnswer(option, index)" class="btn-option">
                {{ option.text }}
              </button>
            </div>
          </div>
          <!-- Gare Selector -->
          <div v-else-if="currentQuestion.usesGareSelector">
            <GareSelector v-model="selectedStation" />
            <button
              @click="handleStationSelection"
              class="btn-next"
              :disabled="!selectedStation.trim()"
            >
              {{ isLastQuestion ? "Terminer" : "Suivant" }}
            </button>
          </div>
          <!-- Free Text Questions -->
          <div v-else>
            <div class="input-container">
              <input
                v-model="freeTextAnswer"
                class="form-control"
                type="text"
                :placeholder="
                  currentQuestion.freeTextPlaceholder || 'Votre réponse'
                "
              />
            </div>
            <button
              @click="handleFreeTextAnswer"
              class="btn-next"
              :disabled="!freeTextAnswer.trim()"
            >
              {{ isLastQuestion ? "Terminer" : "Suivant" }}
            </button>
          </div>
          <!-- Back Button -->
          <button @click="previousQuestion" class="btn-return" v-if="canGoBack">
            Retour
          </button>
          <!-- Partial Validation Button -->
        </div>
      </div>

      <!-- Survey Complete Step -->
      <div v-else-if="isSurveyComplete" class="survey-complete">
        <h2>Merci pour votre réponse et bonne journée.</h2>
        <button @click="resetSurvey" class="btn-next">
          Nouveau questionnaire
        </button>
      </div>

      <!-- Logo -->
      <img class="logo" src="../assets/Alycelogo.webp" alt="Logo Alyce" />
    </div>

    <!-- Footer -->
    <div class="footer">
      <AdminDashboard />
    </div>

    <!-- PDF Modal -->
    <div v-if="showPdf" class="modal">
      <div class="modal-content pdf-content">
        <button class="close" @click="() => { showPdf = false; console.log('Closing PDF modal'); }">
          ×
        </button>
        <iframe :src="pdfUrl" width="100%" height="500px" type="application/pdf">
          This browser does not support PDFs. Please download the PDF to view it.
        </iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { questions } from "./surveyQuestions.js";
import CommuneSelector from "./CommuneSelector.vue";
import AdminDashboard from "./AdminDashboard.vue";
import GareSelector from "./GareSelector.vue";

// Refs
const docCount = ref(0);
const currentStep = ref("enqueteur");
const startDate = ref("");
const enqueteur = ref("");
const currentQuestionIndex = ref(0);
const answers = ref({});
const freeTextAnswer = ref("");
const questionPath = ref(["Q1"]);
const isEnqueteurSaved = ref(false);
const isSurveyComplete = ref(false);
const selectedStation = ref("");
const selectedCommune = ref("");
const postalCodePrefix = ref("");
const showPdf = ref(false);
const pdfUrl = ref("/Plan.pdf");
const stationInput = ref("");
const streetInput = ref("");
const filteredStations = ref([]);
const filteredStreets = ref([]);
const selectedPoste = ref(null);

// Firestore refs
const surveyCollectionRef = collection(db, "Trappes");
const counterDocRef = doc(db, "Trappescounters", "surveyCounter");



// Computed properties
const currentQuestion = computed(() => {
  return currentQuestionIndex.value >= 0 &&
    currentQuestionIndex.value < questions.length
    ? questions[currentQuestionIndex.value]
    : null;
});

const showFilteredStations = computed(
  () => stationInput.value.length > 0 && filteredStations.value.length > 0
);

const showFilteredStreets = computed(
  () => streetInput.value.length > 0 && filteredStreets.value.length > 0
);

const canGoBack = computed(() => questionPath.value.length > 1);

const isLastQuestion = computed(
  () => currentQuestionIndex.value === questions.length - 1
);

const progress = computed(() => {
  if (currentStep.value !== "survey") return 0;
  if (isSurveyComplete.value) return 100;
  const totalQuestions = questions.length;
  const currentQuestionNumber = currentQuestionIndex.value + 1;
  const isLastOrEnding =
    isLastQuestion.value ||
    currentQuestion.value?.options?.some((option) => option.next === "end");
  return isLastOrEnding
    ? 100
    : Math.min(Math.round((currentQuestionNumber / totalQuestions) * 100), 99);
});

const isValidCommuneSelection = computed(() => {
  return (
    selectedCommune.value.includes(" - ") || selectedCommune.value.trim() !== ""
  );
});

// Add these new methods
const filterStations = () => {
  const input = stationInput.value.toLowerCase();
  filteredStations.value = stationsList.filter((station) =>
    station.toLowerCase().includes(input)
  );
};

const filterStreets = () => {
  const input = streetInput.value.toLowerCase();
  filteredStreets.value = streetsList.filter((street) =>
    street.toLowerCase().includes(input)
  );
};

const selectStation = (station) => {
  stationInput.value = station;
  filteredStations.value = [];
};

const selectStreet = (street) => {
  streetInput.value = street;
  filteredStreets.value = [];
};

// Methods
const setEnqueteur = () => {
  if (enqueteur.value.trim() !== "") {
    currentStep.value = "start";
    isEnqueteurSaved.value = true;
  }
};

const startSurvey = () => {
  startDate.value = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  currentStep.value = "survey";
  answers.value = {};
  isSurveyComplete.value = false;
  questionPath.value = ["Q1"]; // Start with Q1
  currentQuestionIndex.value = 0;
};

const selectAnswer = (option, index) => {
  answers.value[currentQuestion.value.id] = index + 1;

  if (currentQuestion.value.id === "Q3a") {
    if (index === 0) {
      // "Trappes" sélectionné
      answers.value[`Q3a_COMMUNE`] = "TRAPPES";
      answers.value["CODE_INSEE"] = "78621";
      answers.value["COMMUNE_LIBRE"] = "";
    }
  }
  if (currentQuestion.value.id === "Q3b") {
    if (index === 0) {
      // "Nord de la gare" sélectionné
      answers.value[`Q3b_COMMUNE`] = "TRAPPES";
      answers.value["CODE_INSEE"] = "78621";
      answers.value["COMMUNE_LIBRE"] = "";
    }
  }

  if (option.next === "end") {
    finishSurvey();
  } else if (option.requiresPrecision) {
    nextQuestion(option.next);
  } else {
    nextQuestion();
  }
};

const handleFreeTextAnswer = () => {
  if (currentQuestion.value) {
    // Skip for street questions since they're handled by handleStreetSelection
    if (
      currentQuestion.value.id === "Q2a" ||
      currentQuestion.value.id === "Q2a_d" ||
      currentQuestion.value.id === "Q2a_nv"
    ) {
      return;
    }

    answers.value[currentQuestion.value.id] = freeTextAnswer.value;
    if (currentQuestionIndex.value < questions.length - 1) {
      nextQuestion();
    } else {
      finishSurvey();
    }
  }
};

const handleStationSelection = () => {
  if (selectedStation.value.trim() !== "") {
    answers.value[currentQuestion.value.id] = selectedStation.value;
    nextQuestion();
    selectedStation.value = ""; // Reset for next use
  }
};

const handleStreetSelection = () => {
  if (streetInput.value.trim() !== "") {
    const isListedStreet = streetsList.includes(streetInput.value);
    const questionId = currentQuestion.value.id;

    // Store the answer based on the question ID
    if (questionId === "Q2a") {
      answers.value["Q2a"] = streetInput.value;
      if (!isListedStreet) {
        answers.value["Q2a_CUSTOM"] = streetInput.value;
      }
    } else if (questionId === "Q2a_d") {
      answers.value["Q2a_d"] = streetInput.value;
      if (!isListedStreet) {
        answers.value["Q2a_d_CUSTOM"] = streetInput.value;
      }
    } else if (questionId === "Q2a_nv") {
      answers.value["Q2a_nv"] = streetInput.value;
      if (!isListedStreet) {
        answers.value["Q2a_nv_CUSTOM"] = streetInput.value;
      }
    }

    // Force move to next question
    const nextQuestionId = currentQuestion.value.next;
    if (nextQuestionId === "end") {
      finishSurvey();
    } else {
      const nextIndex = questions.findIndex((q) => q.id === nextQuestionId);
      if (nextIndex !== -1) {
        currentQuestionIndex.value = nextIndex;
        questionPath.value.push(nextQuestionId);
      }
    }

    // Reset the input
    streetInput.value = "";
    filteredStreets.value = [];
  }
};

// Add these watches
watch(stationInput, () => {
  filterStations();
});

watch(streetInput, () => {
  filterStreets();
});

const updateSelectedCommune = (value) => {
  selectedCommune.value = value;
};

const handleCommuneSelection = () => {
  if (selectedCommune.value.trim() !== "") {
    const parts = selectedCommune.value.split(" - ");
    const currentQuestionId = currentQuestion.value.id;

    if (currentQuestionId === 'Q6') {
      // Handle Q6 data saving
      if (parts.length === 2) {
        const [commune, codeInsee] = parts;
        answers.value['Q6_COMMUNE'] = commune;
        answers.value['Q6_CODE_INSEE'] = codeInsee;
        answers.value['Q6_COMMUNE_LIBRE'] = ""; // Clear any potential free text
      } else {
        answers.value['Q6_COMMUNE'] = ""; // Clear dropdown selection
        answers.value['Q6_CODE_INSEE'] = ""; // Clear INSEE code
        answers.value['Q6_COMMUNE_LIBRE'] = selectedCommune.value.trim(); // Set free text
      }
       // Also save the raw input to Q6 for backward compatibility or direct reference if needed
      answers.value['Q6'] = selectedCommune.value.trim();

    } else if (currentQuestionId === 'Q2_precision') {
       // Handle Q2_precision data saving (existing logic)
      const isNonPassenger = currentQuestionId.includes("nonvoyageur"); // This check might be redundant if only 'Q2_precision' lands here, but keep for safety
      const questionPrefix = isNonPassenger ? "Q2_nonvoyageur" : "Q2"; // Should resolve to 'Q2'

      if (parts.length === 2) {
        // Dropdown selection
        const [commune, codeInsee] = parts;
        answers.value[`${questionPrefix}_COMMUNE`] = commune;
        answers.value["CODE_INSEE"] = codeInsee;
        answers.value["COMMUNE_LIBRE"] = ""; // Clear COMMUNE_LIBRE
      } else {
        // Manual entry or free text
        answers.value[`${questionPrefix}_COMMUNE`] = ""; // Clear the dropdown commune
        answers.value["CODE_INSEE"] = ""; // Clear INSEE code
        answers.value["COMMUNE_LIBRE"] = selectedCommune.value.trim(); // Set COMMUNE_LIBRE
      }
        // Save the raw input to Q2_precision as well
       answers.value['Q2_precision'] = selectedCommune.value.trim();
    } else {
        // Fallback or handle other potential CommuneSelector uses if any
        console.warn("CommuneSelector used on unexpected question:", currentQuestionId);
         answers.value[currentQuestionId] = selectedCommune.value.trim(); // Generic save
    }


    nextQuestion();
  }
};

const nextQuestion = (forcedNextId = null) => {
  let nextQuestionId = forcedNextId;

  if (!nextQuestionId && currentQuestion.value) {
    if (currentQuestion.value.conditionalNext) {
      const conditionConfig = currentQuestion.value.conditionalNext;
      const conditionQuestionId = conditionConfig.condition;
      const actualAnswer = answers.value[conditionQuestionId];

      if (actualAnswer !== undefined) {
        const route = conditionConfig.routes.find(r => r.value === actualAnswer);
        if (route) {
          nextQuestionId = route.next;
        } else {
          // console.warn for debugging, can be removed in production
          // console.warn(`Conditional route not found for ${currentQuestion.value.id} based on ${conditionQuestionId}=${actualAnswer}`);
        }
      } else {
        // console.warn for debugging, can be removed in production
        // console.warn(`Condition answer for ${conditionQuestionId} not found when evaluating conditionalNext for ${currentQuestion.value.id}`);
      }
    } else if (
      currentQuestion.value.usesGareSelector ||
      currentQuestion.value.freeText
    ) {
      nextQuestionId = currentQuestion.value.next;
    } else {
      const selectedAnswerIndex = answers.value[currentQuestion.value.id];
      if (currentQuestion.value.id === "Poste") {
        nextQuestionId = "Q1";
      } else if (selectedAnswerIndex !== undefined && currentQuestion.value.options) { // Added check for options existence
        const selectedOption =
          currentQuestion.value.options[selectedAnswerIndex - 1];
        if (selectedOption) {
          nextQuestionId = selectedOption.next || null;
        } else {
          nextQuestionId = null;
        }
      } else {
         nextQuestionId = null;
      }
    }
  }

  if (nextQuestionId === "end") {
    finishSurvey();
  } else if (nextQuestionId) {
    const nextIndex = questions.findIndex((q) => q.id === nextQuestionId);
    if (nextIndex !== -1) {
      currentQuestionIndex.value = nextIndex;
      questionPath.value.push(nextQuestionId);
      freeTextAnswer.value = "";
      selectedCommune.value = "";
      postalCodePrefix.value = "";
    } else {
      // console.error for debugging, can be removed/handled differently in production
      // console.error(`Next question with ID '${nextQuestionId}' not found in questions array.`);
    }
  } else {
    // console.log for debugging, can be removed in production
    // console.log("No nextQuestionId determined, or it's null. No navigation.");
  }
};

const previousQuestion = () => {
  if (canGoBack.value) {
    // Remove current question from path
    const currentQuestionId = questionPath.value.pop();
    const previousQuestionId =
      questionPath.value[questionPath.value.length - 1];

    // Find indices
    const previousIndex = questions.findIndex(
      (q) => q.id === previousQuestionId
    );

    if (previousIndex !== -1) {
      // Update current question index
      currentQuestionIndex.value = previousIndex;

      // Clear current question's answers
      if (currentQuestionId) {
        // Clear main answer
        delete answers.value[currentQuestionId];

        // Clear any custom/additional fields
        delete answers.value[`${currentQuestionId}_CUSTOM`];

        // Clear special fields for commune questions
        if (currentQuestionId.includes("Q2")) {
          delete answers.value["Q2_COMMUNE"];
          delete answers.value["CODE_INSEE"];
          delete answers.value["COMMUNE_LIBRE"];
        }
      }

      // Reset all input fields
      freeTextAnswer.value = "";
      stationInput.value = "";
      streetInput.value = "";
      selectedCommune.value = "";
      postalCodePrefix.value = "";

      // Clear filtered lists
      filteredStations.value = [];
      filteredStreets.value = [];
    }
  }
};

const finishSurvey = async () => {
  isSurveyComplete.value = true;
  const now = new Date();
  const uniqueId = await getNextId();

  // Determine if it's a passenger or non-passenger survey
  const isPassenger = answers.value["Q1"] === 1;
  const questionPrefix = isPassenger ? "Q2" : "Q2_nonvoyageur";

  // Create answers object
  const orderedAnswers = {
    ID_questionnaire: uniqueId,
    HEURE_DEBUT: startDate.value,
    DATE: now.toLocaleDateString("fr-FR").replace(/\//g, "-"),
    JOUR: now.toLocaleDateString("fr-FR", { weekday: "long" }),
    ENQUETEUR: enqueteur.value,
    HEURE_FIN: now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    TYPE_QUESTIONNAIRE: isPassenger ? "Voyageur" : "Non-voyageur",
    [`${questionPrefix}_COMMUNE`]:
      answers.value[`${questionPrefix}_COMMUNE`] || "",
    CODE_INSEE: answers.value["CODE_INSEE"] || "",
  };

  // Add all answers
  Object.keys(answers.value).forEach((key) => {
    orderedAnswers[key] = answers.value[key];
  });

  await addDoc(surveyCollectionRef, orderedAnswers);
  await getDocCount();
};

const resetSurvey = () => {
  currentStep.value = "start";
  startDate.value = "";
  answers.value = {};
  currentQuestionIndex.value = 0;
  questionPath.value = ["Q1"];
  freeTextAnswer.value = "";
  isSurveyComplete.value = false;
  // Note: We don't clear selectedPoste or sessionStorage
};

const getDocCount = async () => {
  try {
    const querySnapshot = await getDocs(surveyCollectionRef);
    docCount.value = querySnapshot.size;
  } catch (error) {
    console.error("Error getting document count:", error);
  }
};

const getNextId = async () => {
  const counterDoc = await getDoc(counterDocRef);
  let counter = 1;

  if (counterDoc.exists()) {
    counter = counterDoc.data().value + 1;
  }

  await setDoc(counterDocRef, { value: counter });

  return `trappes-${counter.toString().padStart(6, "0")}`;
};

// Add computed property for showing partial validation button
const showPartialValidation = computed(() => {
  if (!currentQuestion.value) return false;

  // Check if we're on the correct path based on Q1 answer
  const isPassengerPath = answers.value["Q1"] === 1;
  const isDescendedPath = answers.value["Q1"] === 2;

  // Get the relevant Q5 question ID based on the path
  const relevantQ5 = isPassengerPath ? "Q5" : isDescendedPath ? "Q5_d" : null;

  if (!relevantQ5) return false;

  // Find the index of the relevant Q5
  const q5Index = questions.findIndex((q) => q.id === relevantQ5);
  if (q5Index === -1) return false;

  // Show button if we're at or past the relevant Q5 and have valid input
  return (
    currentQuestionIndex.value >= q5Index &&
    (currentQuestion.value.id === relevantQ5
      ? stationInput.value.trim() !== ""
      : currentQuestion.value.freeText
      ? freeTextAnswer.value.trim() !== ""
      : currentQuestion.value.streetInput
      ? streetInput.value.trim() !== ""
      : true)
  );
});

// Modify handlePartialValidation to save current answer before finishing
const handlePartialValidation = async () => {
  // Save current answer based on question type
  if (currentQuestion.value) {
    if (
      currentQuestion.value.id === "Q5" ||
      currentQuestion.value.id === "Q5_d"
    ) {
      const isListedStation = stationsList.includes(stationInput.value);
      if (currentQuestion.value.id === "Q5") {
        answers.value["Q5"] = stationInput.value;
        if (!isListedStation) {
          answers.value["Q5_CUSTOM"] = stationInput.value;
        }
      } else {
        answers.value["Q5_d"] = stationInput.value;
        if (!isListedStation) {
          answers.value["Q5_d_CUSTOM"] = stationInput.value;
        }
      }
    } else if (currentQuestion.value.streetInput) {
      const isListedStreet = streetsList.includes(streetInput.value);
      const questionId = currentQuestion.value.id;
      answers.value[questionId] = streetInput.value;
      if (!isListedStreet) {
        answers.value[`${questionId}_CUSTOM`] = streetInput.value;
      }
    } else if (currentQuestion.value.freeText) {
      answers.value[currentQuestion.value.id] = freeTextAnswer.value;
    }
  }

  // Save the survey
  await finishSurvey();

  // Start a new survey immediately
  startSurvey();
};

// Lifecycle hooks
onMounted(() => {
  getDocCount();
});
</script>


<style>
/* Base styles */
body {
  background-color: #2a3b63;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #2a3b63;
  color: white;
}

.content-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5% 0;
  width: 90%;
  max-width: 600px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-y: auto;
}

.question-container {
  width: 100%;
  margin-bottom: 30px;
}

.input-container,
.station-input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
}

.form-control {
  width: 100%;
  max-width: 400px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid white;
  background-color: #333;
  color: white;
  font-size: 16px;
  margin-bottom: 15px;
}

.btn-next,
.btn-return,
.btn-option,
.btn-pdf {
  width: 100%;
  max-width: 400px;
  color: white;
  padding: 15px;
  margin-top: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.btn-next {
  background-color: green;
}

.btn-return {
  background-color: grey;
  margin-top: 30px;
}

.btn-option {
  background-color: #4a5a83;
  text-align: left;
}

.btn-pdf {
  background-color: #3498db;
  margin: 15px auto;
  display: block;
}

.commune-dropdown {
  position: relative;
  width: 100%;
  max-width: 400px;
  max-height: 200px;
  overflow-y: auto;
  background-color: #333;
  border: 1px solid #666;
  border-radius: 5px;
  z-index: 1000;
  margin: -10px auto 15px;
  padding: 0;
  list-style: none;
}

.commune-option {
  padding: 10px;
  cursor: pointer;
  color: white;
  border-bottom: 1px solid #444;
}

.commune-option:hover {
  background-color: #444;
}

.station-input-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.logo {
  max-width: 25%;
  height: auto;
  margin-top: 40px;
  margin-bottom: 20px;
}

.footer {
  background: linear-gradient(to right, #4c4faf, #3f51b5);
  padding: 20px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease-in-out;
}

@media screen and (max-width: 480px) {
  .commune-dropdown {
    width: 90%;
    left: 50%;
    transform: translateX(-50%);
  }

  .form-control {
    max-width: 90%;
  }
}

.modal {
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #1a1a1a;
}

.pdf-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.pdf-content iframe {
  border: none;
  width: 100%;
  height: 100%;
  background: white;
}

.close {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 10000;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close::before,
.close::after {
  content: "";
  position: absolute;
  width: 24px;
  height: 2px;
  background-color: white;
  transform-origin: center;
}

.close::before {
  transform: rotate(45deg);
}

.close::after {
  transform: rotate(-45deg);
}

.close:hover {
  opacity: 1;
}

@media screen and (min-width: 768px) {
  .modal {
    padding: 40px;
  }

  .modal-content {
    max-width: 1200px;
    margin: 0 auto;
  }
}

.btn-partial {
  width: 100%;
  max-width: 400px;
  color: white;
  padding: 15px;
  margin-top: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  background-color: #ff9800;
}
</style>
