import tempfile
import unittest
from pathlib import Path

import app


class ProfissionaisTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        app.DATABASE = str(Path(self.temp_dir.name) / "test.db")
        app.init_db()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_create_profissional(self):
        payload = {
            "nome": "Dr. João",
            "especialidade": "Cardiologia",
            "percentual_repasse": 35,
            "clinica_id": 10,
        }
        response, status = app.create_profissional(payload)

        self.assertEqual(status, 201)
        self.assertEqual(response["clinica_id"], 10)
        self.assertEqual(response["nome"], "Dr. João")

    def test_list_profissionais_filtra_por_clinica_id(self):
        app.create_profissional(
            {
                "nome": "Dra. Ana",
                "especialidade": "Ortopedia",
                "percentual_repasse": 40,
                "clinica_id": 1,
            }
        )
        app.create_profissional(
            {
                "nome": "Dr. Carlos",
                "especialidade": "Neurologia",
                "percentual_repasse": 45,
                "clinica_id": 2,
            }
        )

        response, status = app.list_profissionais(1)

        self.assertEqual(status, 200)
        self.assertEqual(len(response), 1)
        self.assertEqual(response[0]["nome"], "Dra. Ana")
        self.assertEqual(response[0]["clinica_id"], 1)

    def test_list_profissionais_sem_clinica_id(self):
        response, status = app.list_profissionais(None)
        self.assertEqual(status, 400)
        self.assertIn("error", response)


if __name__ == "__main__":
    unittest.main()
