from pydantic import BaseModel, Field, model_validator


class FeedbackInput(BaseModel):
    name: str | None = Field(None, max_length=50)
    reliability_rating: int = Field(..., ge=1, le=4)
    reliability_comment: str | None = Field(None, max_length=1000)
    receptivity_rating: int = Field(..., ge=1, le=4)
    receptivity_comment: str | None = Field(None, max_length=1000)
    energy_rating: int = Field(..., ge=1, le=4)
    blind_spot: str = Field(..., min_length=5, max_length=1000)
    future_skill: str = Field(..., min_length=5, max_length=1000)

    @model_validator(mode="after")
    def low_scores_require_comment(self):
        if self.reliability_rating <= 2 and not self.reliability_comment:
            raise ValueError("reliability_comment is required for ratings 1 or 2")
        if self.receptivity_rating <= 2 and not self.receptivity_comment:
            raise ValueError("receptivity_comment is required for ratings 1 or 2")
        return self
