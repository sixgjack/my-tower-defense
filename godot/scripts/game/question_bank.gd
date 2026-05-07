class_name QuestionBank
extends RefCounted

const DATA_PATH := "res://data/questions_seed.json"

var _questions: Array = []


func _init() -> void:
	_load_seed_questions()


func _load_seed_questions() -> void:
	_questions.clear()
	if not FileAccess.file_exists(DATA_PATH):
		_questions = _fallback_questions()
		return
	var f := FileAccess.open(DATA_PATH, FileAccess.READ)
	if f == null:
		_questions = _fallback_questions()
		return
	var txt := f.get_as_text()
	var parsed: Variant = JSON.parse_string(txt)
	if parsed is Array:
		for q in parsed:
			if q is Dictionary and q.has("prompt") and q.has("choices") and q.has("answerIndex"):
				_questions.append(q)
	if _questions.is_empty():
		_questions = _fallback_questions()


func random_question() -> Dictionary:
	if _questions.is_empty():
		_questions = _fallback_questions()
	return _questions[randi() % _questions.size()]


func _fallback_questions() -> Array:
	return [
		{
			"id": "m1",
			"subject": "math",
			"prompt": "12 + 8 = ?",
			"choices": ["18", "20", "22", "24"],
			"answerIndex": 1,
		},
		{
			"id": "s1",
			"subject": "science",
			"prompt": "Water boils at what temperature (C)?",
			"choices": ["90", "95", "100", "110"],
			"answerIndex": 2,
		},
		{
			"id": "p1",
			"subject": "programming",
			"prompt": "Which keyword declares a function in JavaScript?",
			"choices": ["def", "function", "func", "lambda"],
			"answerIndex": 1,
		},
	]
