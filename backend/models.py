from sqlalchemy import Column, String, Boolean, Integer, Text, BigInteger
from database import Base


class Deck(Base):
    __tablename__ = "decks"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    card_theme = Column(String, nullable=False)
    favorite = Column(Boolean, default=False)
    created_at = Column(BigInteger, nullable=False)
    best_scores = Column(Text, default="{}")


class Replay(Base):
    __tablename__ = "replays"

    id = Column(String, primary_key=True, index=True)
    deck_name = Column(String, nullable=False)
    deck_theme = Column(String, nullable=False)
    grid_size = Column(Text, nullable=False)
    card_style = Column(Text, nullable=False)
    moves = Column(Integer, nullable=False)
    time = Column(Integer, nullable=False)
    played_at = Column(BigInteger, nullable=False)
    initial_cards = Column(Text, nullable=False)
    move_log = Column(Text, nullable=False)
