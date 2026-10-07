import unittest
from types import SimpleNamespace
from unittest.mock import patch

import knowledge_base


class EmptyKnowledgeBaseTests(unittest.TestCase):
    def test_empty_collection_does_not_initialize_vector_search(self):
        database = SimpleNamespace(
            count=lambda: 0,
            search=lambda *_args, **_kwargs: self.fail("search called"),
        )

        with patch.object(knowledge_base, "get_db", return_value=database):
            self.assertEqual(knowledge_base.search_documents("A sample question"), [])


if __name__ == "__main__":
    unittest.main()
