# coding: utf-8

"""
    Trieve API

    Trieve OpenAPI Specification. This document describes all of the operations available through the Trieve API.

    The version of the OpenAPI document: 0.11.9
    Contact: developers@trieve.ai
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


from __future__ import annotations
import pprint
import re  # noqa: F401
import json

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictFloat, StrictInt
from typing import Any, ClassVar, Dict, List, Optional, Union
from trieve_py_client.models.geo_info_with_bias import GeoInfoWithBias
from trieve_py_client.models.qdrant_sort_by import QdrantSortBy
from typing import Optional, Set
from typing_extensions import Self

class SortOptions(BaseModel):
    """
    Sort Options lets you specify different methods to rerank the chunks in the result set. If not specified, this defaults to the score of the chunks.
    """ # noqa: E501
    location_bias: Optional[GeoInfoWithBias] = None
    sort_by: Optional[QdrantSortBy] = None
    tag_weights: Optional[Dict[str, Union[StrictFloat, StrictInt]]] = Field(default=None, description="Tag weights is a JSON object which can be used to boost the ranking of chunks with certain tags. This is useful for when you want to be able to bias towards chunks with a certain tag on the fly. The keys are the tag names and the values are the weights.")
    use_weights: Optional[StrictBool] = Field(default=None, description="Set use_weights to true to use the weights of the chunks in the result set in order to sort them. If not specified, this defaults to true.")
    __properties: ClassVar[List[str]] = ["location_bias", "sort_by", "tag_weights", "use_weights"]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
    )


    def to_str(self) -> str:
        """Returns the string representation of the model using alias"""
        return pprint.pformat(self.model_dump(by_alias=True))

    def to_json(self) -> str:
        """Returns the JSON representation of the model using alias"""
        # TODO: pydantic v2: use .model_dump_json(by_alias=True, exclude_unset=True) instead
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        """Create an instance of SortOptions from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        """
        excluded_fields: Set[str] = set([
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        # override the default output from pydantic by calling `to_dict()` of location_bias
        if self.location_bias:
            _dict['location_bias'] = self.location_bias.to_dict()
        # override the default output from pydantic by calling `to_dict()` of sort_by
        if self.sort_by:
            _dict['sort_by'] = self.sort_by.to_dict()
        # set to None if location_bias (nullable) is None
        # and model_fields_set contains the field
        if self.location_bias is None and "location_bias" in self.model_fields_set:
            _dict['location_bias'] = None

        # set to None if sort_by (nullable) is None
        # and model_fields_set contains the field
        if self.sort_by is None and "sort_by" in self.model_fields_set:
            _dict['sort_by'] = None

        # set to None if tag_weights (nullable) is None
        # and model_fields_set contains the field
        if self.tag_weights is None and "tag_weights" in self.model_fields_set:
            _dict['tag_weights'] = None

        # set to None if use_weights (nullable) is None
        # and model_fields_set contains the field
        if self.use_weights is None and "use_weights" in self.model_fields_set:
            _dict['use_weights'] = None

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of SortOptions from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "location_bias": GeoInfoWithBias.from_dict(obj["location_bias"]) if obj.get("location_bias") is not None else None,
            "sort_by": QdrantSortBy.from_dict(obj["sort_by"]) if obj.get("sort_by") is not None else None,
            "tag_weights": obj.get("tag_weights"),
            "use_weights": obj.get("use_weights")
        })
        return _obj


