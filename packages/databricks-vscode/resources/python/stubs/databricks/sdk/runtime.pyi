import typing
from pyspark.sql.session import SparkSession
from pyspark.sql.functions import udf as U
from pyspark.sql.context import SQLContext

udf = U
spark: SparkSession
sc = spark.sparkContext
sqlContext: SQLContext
sql = sqlContext.sql
table = sqlContext.table

#TODO: Add docstrings
class dbutils:
    class fs:
        def help(): ...
        def cp(from_: str, to: str, recurse: bool = False) -> bool: ...
        def head(file: str, maxBytes: int) -> str: ...
        def ls(dir: str) -> typing.List[str]: ...
        def mkdirs(dir: str) -> bool: ...
        def put(file: str, contents: str, overwrite: bool = False) -> bool: ...
        def rm(dir: str, recurse: bool = False) -> bool: ...
        def mount(source: str, mountPoint: str, encryptionType: str = "", owner: str = "", extraConfigs: typing.Map[str, str] = {}) -> bool: ...
        def mounts() -> typing.List[str]: ...
        def refreshMounts() -> bool: ...
        def unmount(mountPoint: str) -> bool: ...
    class notebook:
        def help(): ...
        def exit(value: str): ...
        def run(path: str, timeout: int, arguments: typing.Map[str, str]) -> str: ...
    class secrets:
        def help(): ...
        def get(scope: str, key: str) -> str: ...
        def getBytes(scope: str, key: str) -> bytes: ...
        def list(scope: str) -> typing.List[str]: ...
        def listScopes() -> typing.List[str]: ...
    class widgets:
        def help(): ...
        def combobox(name: str, defaultValue: str, choices: typing.List[str], label: str = ""): ...
        def dropdown(name: str, defaultValue: str, choices: typing.List[str], label: str = ""): ...
        def get(name: str) -> str: ...
        def getArgument(name: str) -> str: ...
        def multiselect(name: str, defaultValue: str, choices: typing.List[str], label: str = ""): ...
        def remove(name: str): ...
        def removeAll(): ...
        def text(name: str, defaultValue: str, label: str = ""): ...
    class credentials:
        def help(): ...
        def assumeRole(role: str) -> bool: ...
        def showCurrentRole() -> typing.List[str]: ...
        def showRoles() -> typing.List[str]: ...

getArgument = dbutils.widgets.getArgument
