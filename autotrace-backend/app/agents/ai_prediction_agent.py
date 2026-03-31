import joblib

class AIPredictionAgent:

    def __init__(self):
        self.model = joblib.load("cost_model.pkl")
        self.area_encoder = joblib.load("area_encoder.pkl")
        self.build_encoder = joblib.load("build_encoder.pkl")
        self.complexity_encoder = joblib.load("complexity_encoder.pkl")

    def run(self, state):

        distance = state["distance_km"]

        area = self.area_encoder.transform([state["area_type"]])[0]
        build = self.build_encoder.transform([state["build_type"]])[0]
        complexity = self.complexity_encoder.transform([state["complexity"]])[0]

        prediction = self.model.predict([[distance,area,build,complexity]])

        state["ai_predicted_cost"] = float(prediction[0])

        return state
