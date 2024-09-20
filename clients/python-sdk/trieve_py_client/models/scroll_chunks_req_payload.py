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

from pydantic import BaseModel, ConfigDict, Field, StrictStr
from typing import Any, ClassVar, Dict, List, Optional
from typing_extensions import Annotated
from trieve_py_client.models.chunk_filter import ChunkFilter
from trieve_py_client.models.sort_by_field import SortByField
from typing import Optional, Set
from typing_extensions import Self

class ScrollChunksReqPayload(BaseModel):
    """
    ScrollChunksReqPayload
    """ # noqa: E501
    filters: Optional[ChunkFilter] = None
    offset_chunk_id: Optional[StrictStr] = Field(default=None, description="Offset chunk id is the id of the chunk to start the page from. If not specified, this defaults to the first chunk in the dataset sorted by id ascending.")
    page_size: Optional[Annotated[int, Field(strict=True, ge=0)]] = Field(default=None, description="Page size is the number of chunks to fetch. This can be used to fetch more than 10 chunks at a time.")
    sort_by: Optional[SortByField] = None
    __properties: ClassVar[List[str]] = ["filters", "offset_chunk_id", "page_size", "sort_by"]

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
        """Create an instance of ScrollChunksReqPayload from a JSON string"""
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
        # override the default output from pydantic by calling `to_dict()` of filters
        if self.filters:
            _dict['filters'] = self.filters.to_dict()
        # override the default output from pydantic by calling `to_dict()` of sort_by
        if self.sort_by:
            _dict['sort_by'] = self.sort_by.to_dict()
        # set to None if filters (nullable) is None
        # and model_fields_set contains the field
        if self.filters is None and "filters" in self.model_fields_set:
            _dict['filters'] = None

        # set to None if offset_chunk_id (nullable) is None
        # and model_fields_set contains the field
        if self.offset_chunk_id is None and "offset_chunk_id" in self.model_fields_set:
            _dict['offset_chunk_id'] = None

        # set to None if page_size (nullable) is None
        # and model_fields_set contains the field
        if self.page_size is None and "page_size" in self.model_fields_set:
            _dict['page_size'] = None

        # set to None if sort_by (nullable) is None
        # and model_fields_set contains the field
        if self.sort_by is None and "sort_by" in self.model_fields_set:
            _dict['sort_by'] = None

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of ScrollChunksReqPayload from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "filters": ChunkFilter.from_dict(obj["filters"]) if obj.get("filters") is not None else None,
            "offset_chunk_id": obj.get("offset_chunk_id"),
            "page_size": obj.get("page_size"),
            "sort_by": SortByField.from_dict(obj["sort_by"]) if obj.get("sort_by") is not None else None
        })
        return _obj


